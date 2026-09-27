/**
 * Device-bound secrets, kept in the iOS Keychain / Android Keystore via
 * SecureStore, never in AsyncStorage.
 */
import * as SecureStore from 'expo-secure-store';

import { fromBase64, toBase64 } from '@/lib/crypto';

const SESSION_KEY = 'hv.session';
const masterKeyName = (userId: string) => `hv.mk.${userId.replace(/[^A-Za-z0-9._-]/g, '_')}`;

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export interface StoredSession {
  sessionToken: string;
  userId: string;
  email: string;
  name: string;
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY, OPTIONS);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), OPTIONS);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY, OPTIONS).catch(() => {});
}

export async function loadMasterKey(userId: string): Promise<Uint8Array | null> {
  try {
    const raw = await SecureStore.getItemAsync(masterKeyName(userId), OPTIONS);
    return raw ? fromBase64(raw) : null;
  } catch {
    return null;
  }
}

export async function saveMasterKey(userId: string, key: Uint8Array) {
  await SecureStore.setItemAsync(masterKeyName(userId), toBase64(key), OPTIONS);
}

export async function clearMasterKey(userId: string) {
  await SecureStore.deleteItemAsync(masterKeyName(userId), OPTIONS).catch(() => {});
}
