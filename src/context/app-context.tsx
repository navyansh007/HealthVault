import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytes } from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  authApi,
  documentsApi,
  fetchFromIpfs,
  onSessionExpired,
  setApiSession,
  vaultApi,
  type AuthResult,
  type RemoteDocument,
} from '@/lib/api';
import {
  decryptFile,
  decryptMetadata,
  decryptProfile,
  encryptDocument,
  encryptProfile,
  generateMasterKey,
  generateRecoveryKey,
  toBase64,
  unwrapDocumentKey,
  unwrapMasterKey,
  wrapMasterKey,
} from '@/lib/crypto';
import {
  clearMasterKey,
  clearSession,
  loadMasterKey,
  loadSession,
  saveMasterKey,
  saveSession,
  type StoredSession,
} from '@/lib/secure-keys';
import { clearPersistedState, EMPTY_STATE, loadPersistedState, PersistedState, savePersistedState } from '@/lib/storage';
import { DocumentMetadata, PatientProfile, UploadDraft, VaultDocument } from '@/lib/types';
import { clearPlaintextCache, deleteQuietly, readFileBytes, writeDecryptedFile, writeUploadTemp } from '@/lib/vault-files';

export type OnboardingStep =
  | '/onboarding/recovery-save'
  | '/onboarding/recovery-enter'
  | '/onboarding/profile'
  | '/onboarding/consent'
  | '/onboarding/pin-setup'
  | '/onboarding/done';

interface AppContextValue {
  hydrated: boolean;
  onboardingComplete: boolean;
  locked: boolean;
  hasPin: boolean;
  session: StoredSession | null;
  hasVaultKey: boolean;
  profile: PatientProfile | null;
  documents: VaultDocument[];
  syncing: boolean;
  syncError: string | null;
  consentGivenAt: string | null;
  /** Recovery key generated for a new vault, shown once on the save screen. */
  pendingRecoveryKey: string | null;

  uploadDraft: UploadDraft | null;
  setUploadDraft: (draft: UploadDraft | null) => void;

  completeSignIn: (result: Extract<AuthResult, { status: 'signed_in' }>) => Promise<OnboardingStep>;
  resumeOnboarding: () => Promise<OnboardingStep | null>;
  confirmRecoveryKeySaved: () => Promise<OnboardingStep>;
  restoreWithRecoveryKey: (recoveryKey: string) => Promise<OnboardingStep>;
  saveProfile: (profile: PatientProfile) => Promise<void>;
  giveConsent: () => void;
  setPin: (pin: string) => Promise<void>;
  completeOnboarding: () => void;
  unlock: (pin: string) => Promise<boolean>;
  lockNow: () => void;

  refreshVault: () => Promise<void>;
  addDocument: (draft: UploadDraft, metadata: DocumentMetadata) => Promise<VaultDocument>;
  removeDocument: (id: string) => Promise<void>;
  /** Downloads from IPFS, decrypts, and returns a local file URI (cached until lock). */
  openDocumentFile: (doc: VaultDocument) => Promise<string>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

async function hashPin(pin: string, salt: string) {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, `healthvault-pin:${salt}:${pin}`);
}

function extensionFor(doc: VaultDocument) {
  if (doc.fileKind === 'pdf') return 'pdf';
  const fromName = doc.fileName?.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return doc.mimeType === 'image/png' ? 'png' : 'jpg';
}

function decryptRemoteDocument(masterKey: Uint8Array, remote: RemoteDocument): VaultDocument {
  const dek = unwrapDocumentKey(masterKey, remote.wrappedKey);
  const metadata = decryptMetadata<DocumentMetadata>(dek, remote.encryptedMetadata);
  return {
    ...metadata,
    id: remote.id,
    cid: remote.cid,
    sizeBytes: remote.sizeBytes,
    wrappedKey: remote.wrappedKey,
    addedAt: remote.createdAt,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [locked, setLocked] = useState(false);
  const [persisted, setPersisted] = useState<PersistedState>(EMPTY_STATE);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [masterKey, setMasterKey] = useState<Uint8Array | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingRecoveryKey, setPendingRecoveryKey] = useState<string | null>(null);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft | null>(null);

  const pendingWrappedKey = useRef<string | null>(null);
  const decryptedUris = useRef(new Map<string, string>());
  // Onboarding steps run across several awaits; read the latest state, not a stale closure.
  const persistedRef = useRef(persisted);
  useEffect(() => {
    persistedRef.current = persisted;
  }, [persisted]);

  useEffect(() => {
    (async () => {
      const [state, stored] = await Promise.all([loadPersistedState(), loadSession()]);
      let key: Uint8Array | null = null;
      if (stored) {
        setApiSession(stored.sessionToken);
        key = await loadMasterKey(stored.userId);
      }
      // Device state from a different account is meaningless; start onboarding fresh.
      const sameUser = stored && state.userId === stored.userId;
      const effective = sameUser ? state : { ...EMPTY_STATE, userId: stored?.userId ?? null };
      const ready = Boolean(stored && key && effective.onboardingComplete);

      setPersisted(effective);
      setSession(stored);
      setMasterKey(key);
      setLocked(ready && Boolean(effective.pinHash));
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    savePersistedState(persisted);
  }, [hydrated, persisted]);

  const resetLocal = useCallback(async (userId: string | null) => {
    setApiSession(null);
    await clearSession();
    if (userId) await clearMasterKey(userId);
    await clearPersistedState();
    clearPlaintextCache();
    decryptedUris.current.clear();
    pendingWrappedKey.current = null;
    setPersisted(EMPTY_STATE);
    setSession(null);
    setMasterKey(null);
    setProfile(null);
    setDocuments([]);
    setPendingRecoveryKey(null);
    setUploadDraft(null);
    setSyncError(null);
    setLocked(false);
  }, []);

  useEffect(() => {
    onSessionExpired(() => resetLocal(session?.userId ?? null));
    return () => onSessionExpired(null);
  }, [resetLocal, session?.userId]);

  const lock = useCallback(() => {
    setLocked(true);
    clearPlaintextCache();
    decryptedUris.current.clear();
  }, []);

  useEffect(() => {
    if (!hydrated || !persisted.pinHash || !persisted.onboardingComplete) return;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') lock();
    });
    return () => sub.remove();
  }, [hydrated, persisted.pinHash, persisted.onboardingComplete, lock]);

  const refreshVault = useCallback(async () => {
    if (!masterKey) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const [{ encryptedProfile }, { documents: remote }] = await Promise.all([
        vaultApi.getProfile(),
        documentsApi.list(),
      ]);
      if (encryptedProfile) setProfile(decryptProfile<PatientProfile>(masterKey, encryptedProfile));
      const decrypted = remote.map((r) => decryptRemoteDocument(masterKey, r));
      setDocuments(decrypted);
    } catch (error) {
      setSyncError(errorMessage(error));
    } finally {
      setSyncing(false);
    }
  }, [masterKey]);

  const vaultReady = hydrated && persisted.onboardingComplete && Boolean(masterKey) && !locked;
  useEffect(() => {
    if (!vaultReady) return;
    const t = setTimeout(refreshVault, 0);
    return () => clearTimeout(t);
  }, [vaultReady, refreshVault]);

  const stepAfterKey = useCallback(
    async (key: Uint8Array): Promise<OnboardingStep> => {
      const { encryptedProfile } = await vaultApi.getProfile();
      if (encryptedProfile) {
        setProfile(decryptProfile<PatientProfile>(key, encryptedProfile));
        if (!persistedRef.current.consentGivenAt) return '/onboarding/consent';
        if (!persistedRef.current.pinHash) return '/onboarding/pin-setup';
        return '/onboarding/done';
      }
      return '/onboarding/profile';
    },
    [],
  );

  const stepForSession = useCallback(
    async (userId: string): Promise<OnboardingStep> => {
      const [local, remote] = await Promise.all([loadMasterKey(userId), vaultApi.getKey()]);

      if (remote.wrappedMasterKey) {
        if (!local) {
          pendingWrappedKey.current = remote.wrappedMasterKey;
          return '/onboarding/recovery-enter';
        }
        setMasterKey(local);
        return stepAfterKey(local);
      }

      // No vault on the server yet: create one (or finish creating it, if the
      // user left before confirming their recovery key last time).
      const key = local ?? generateMasterKey();
      if (!local) await saveMasterKey(userId, key);
      const recoveryKey = generateRecoveryKey();
      pendingWrappedKey.current = wrapMasterKey(key, recoveryKey, userId);
      setMasterKey(key);
      setPendingRecoveryKey(recoveryKey);
      return '/onboarding/recovery-save';
    },
    [stepAfterKey],
  );

  const completeSignIn = useCallback<AppContextValue['completeSignIn']>(
    async (result) => {
      const stored: StoredSession = {
        sessionToken: result.sessionToken,
        userId: result.user.id,
        email: result.user.email,
        name: result.user.name,
      };
      await saveSession(stored);
      setApiSession(result.sessionToken, result.accessToken);
      setSession(stored);
      if (persistedRef.current.userId !== stored.userId) {
        persistedRef.current = { ...EMPTY_STATE, userId: stored.userId };
        setPersisted(persistedRef.current);
      }
      return stepForSession(stored.userId);
    },
    [stepForSession],
  );

  const resumeOnboarding = useCallback(async () => {
    if (!session) return null;
    return stepForSession(session.userId);
  }, [session, stepForSession]);

  const confirmRecoveryKeySaved = useCallback(async () => {
    if (!masterKey || !pendingWrappedKey.current) throw new Error('No recovery key to confirm');
    await vaultApi.createKey(pendingWrappedKey.current);
    pendingWrappedKey.current = null;
    setPendingRecoveryKey(null);
    return stepAfterKey(masterKey);
  }, [masterKey, stepAfterKey]);

  const restoreWithRecoveryKey = useCallback(
    async (recoveryKey: string) => {
      if (!session || !pendingWrappedKey.current) throw new Error('Sign in again to restore your vault');
      const key = unwrapMasterKey(pendingWrappedKey.current, recoveryKey, session.userId);
      await saveMasterKey(session.userId, key);
      pendingWrappedKey.current = null;
      setMasterKey(key);
      return stepAfterKey(key);
    },
    [session, stepAfterKey],
  );

  const saveProfile = useCallback(
    async (next: PatientProfile) => {
      if (!masterKey) throw new Error('Vault is locked');
      await vaultApi.putProfile(encryptProfile(masterKey, next));
      setProfile(next);
    },
    [masterKey],
  );

  const setPin = useCallback(async (pin: string) => {
    const salt = toBase64(getRandomBytes(16));
    const pinHash = await hashPin(pin, salt);
    setPersisted((prev) => ({ ...prev, pinHash, pinSalt: salt }));
  }, []);

  const unlock = useCallback(
    async (pin: string) => {
      if (!persisted.pinHash || !persisted.pinSalt || !pin) return false;
      const ok = (await hashPin(pin, persisted.pinSalt)) === persisted.pinHash;
      if (ok) setLocked(false);
      return ok;
    },
    [persisted.pinHash, persisted.pinSalt],
  );

  const addDocument = useCallback(
    async (draft: UploadDraft, metadata: DocumentMetadata) => {
      if (!masterKey) throw new Error('Vault is locked');
      const plaintext = await readFileBytes(draft.uri);
      const encrypted = encryptDocument(masterKey, plaintext, metadata);
      const temp = writeUploadTemp(encrypted.ciphertext);
      try {
        const { document } = await documentsApi.upload(temp, encrypted.wrappedKey, encrypted.encryptedMetadata);
        const doc = decryptRemoteDocument(masterKey, document);
        setDocuments((prev) => [doc, ...prev]);
        return doc;
      } finally {
        deleteQuietly(temp);
      }
    },
    [masterKey],
  );

  const removeDocument = useCallback(async (id: string) => {
    await documentsApi.remove(id);
    decryptedUris.current.delete(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const openDocumentFile = useCallback(
    async (doc: VaultDocument) => {
      if (!masterKey) throw new Error('Vault is locked');
      const cached = decryptedUris.current.get(doc.id);
      if (cached) return cached;
      const ciphertext = await fetchFromIpfs(doc.cid);
      const plaintext = decryptFile(unwrapDocumentKey(masterKey, doc.wrappedKey), ciphertext);
      const uri = writeDecryptedFile(doc.id, extensionFor(doc), plaintext);
      decryptedUris.current.set(doc.id, uri);
      return uri;
    },
    [masterKey],
  );

  const signOut = useCallback(async () => {
    const token = session?.sessionToken;
    if (token) await authApi.signOut(token).catch(() => {});
    await resetLocal(session?.userId ?? null);
  }, [resetLocal, session]);

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      onboardingComplete: persisted.onboardingComplete && Boolean(session) && Boolean(masterKey),
      locked,
      hasPin: Boolean(persisted.pinHash),
      session,
      hasVaultKey: Boolean(masterKey),
      profile,
      documents,
      syncing,
      syncError,
      consentGivenAt: persisted.consentGivenAt,
      pendingRecoveryKey,

      uploadDraft,
      setUploadDraft,

      completeSignIn,
      resumeOnboarding,
      confirmRecoveryKeySaved,
      restoreWithRecoveryKey,
      saveProfile,
      giveConsent: () => setPersisted((prev) => ({ ...prev, consentGivenAt: new Date().toISOString() })),
      setPin,
      completeOnboarding: () => {
        setPersisted((prev) => ({ ...prev, onboardingComplete: true }));
        setLocked(false);
      },
      unlock,
      lockNow: lock,

      refreshVault,
      addDocument,
      removeDocument,
      openDocumentFile,
      signOut,
    }),
    [
      hydrated,
      persisted,
      session,
      masterKey,
      locked,
      profile,
      documents,
      syncing,
      syncError,
      pendingRecoveryKey,
      uploadDraft,
      completeSignIn,
      resumeOnboarding,
      confirmRecoveryKeySaved,
      restoreWithRecoveryKey,
      saveProfile,
      setPin,
      unlock,
      lock,
      refreshVault,
      addDocument,
      removeDocument,
      openDocumentFile,
      signOut,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
