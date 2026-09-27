/**
 * Client for the HealthVault API routes (src/app/api) and IPFS gateways.
 * Handles the short-lived access token transparently: it is refreshed from
 * the session token before expiry and once more on a 401.
 */
import Constants from 'expo-constants';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';

function resolveApiBase(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  // In development, API routes are served by the same Metro dev server as the bundle.
  const hostUri = Constants.expoConfig?.hostUri;
  if (__DEV__ && hostUri) return `http://${hostUri}`;
  return '';
}

const API_BASE = resolveApiBase();

const DEFAULT_GATEWAYS = ['https://ipfs.io/ipfs/', 'https://dweb.link/ipfs/', 'https://gateway.pinata.cloud/ipfs/'];

const IPFS_GATEWAYS = (process.env.EXPO_PUBLIC_IPFS_GATEWAYS ?? '')
  .split(',')
  .map((g) => g.trim())
  .filter(Boolean)
  .map((g) => (g.endsWith('/') ? g : `${g}/`))
  .concat(DEFAULT_GATEWAYS)
  .filter((g, i, all) => all.indexOf(g) === i);

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

async function parseResponse<T>(response: { ok: boolean; status: number; text(): Promise<string> }): Promise<T> {
  const text = await response.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON (e.g. an HTML error page from a proxy).
  }
  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      body?.error?.message ?? `Request failed (${response.status})`,
      body?.error?.code ?? 'HTTP_ERROR',
    );
  }
  return body as T;
}

let sessionToken: string | null = null;
let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let refreshInFlight: Promise<string> | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export function setApiSession(token: string | null, initialAccessToken?: string) {
  sessionToken = token;
  accessToken = initialAccessToken ?? null;
  accessTokenExpiresAt = initialAccessToken ? jwtExpiry(initialAccessToken) : 0;
}

/** Called when the server rejects the session itself (revoked/expired). */
export function onSessionExpired(handler: (() => void) | null) {
  sessionExpiredHandler = handler;
}

function jwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

async function refreshAccessToken(): Promise<string> {
  if (!sessionToken) throw new ApiRequestError(401, 'Not signed in', 'UNAUTHENTICATED');
  refreshInFlight ??= (async () => {
    try {
      const res = await postJson<{ accessToken: string }>('/api/auth/token', { sessionToken });
      accessToken = res.accessToken;
      accessTokenExpiresAt = jwtExpiry(res.accessToken);
      return res.accessToken;
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) sessionExpiredHandler?.();
      throw error;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < accessTokenExpiresAt - 60_000) return accessToken;
  return refreshAccessToken();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await expoFetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

async function authed<T>(path: string, init: { method?: string; body?: any; json?: unknown } = {}): Promise<T> {
  const send = async (token: string) => {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    let body = init.body;
    if (init.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(init.json);
    }
    return expoFetch(`${API_BASE}${path}`, { method: init.method ?? 'GET', headers, body });
  };

  let response = await send(await getAccessToken());
  if (response.status === 401) response = await send(await refreshAccessToken());
  return parseResponse<T>(response);
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export type AuthResult =
  | { status: 'signed_in'; sessionToken: string; accessToken: string; user: AuthUser }
  | { status: 'verification_required' };

export type OtpType = 'sign-in' | 'email-verification' | 'forget-password';

export const authApi = {
  signUp: (email: string, password: string, name: string) =>
    postJson<AuthResult>('/api/auth/sign-up', { email, password, name }),
  signIn: (email: string, password: string) => postJson<AuthResult>('/api/auth/sign-in', { email, password }),
  sendOtp: (email: string, type: OtpType) => postJson<{ sent: true }>('/api/auth/otp/send', { email, type }),
  signInWithOtp: (email: string, otp: string) => postJson<AuthResult>('/api/auth/otp/sign-in', { email, otp }),
  verifyEmail: (email: string, otp: string) => postJson<AuthResult>('/api/auth/verify-email', { email, otp }),
  resetPassword: (email: string, otp: string, password: string) =>
    postJson<{ reset: true }>('/api/auth/reset-password', { email, otp, password }),
  signOut: (token: string) => postJson<{ signedOut: true }>('/api/auth/sign-out', { sessionToken: token }),
};

export const vaultApi = {
  getKey: () => authed<{ wrappedMasterKey: string | null; keyVersion?: number }>('/api/vault/key'),
  createKey: (wrappedMasterKey: string) =>
    authed<{ keyVersion: number }>('/api/vault/key', { method: 'PUT', json: { wrappedMasterKey } }),
  getProfile: () => authed<{ encryptedProfile: string | null }>('/api/vault/profile'),
  putProfile: (encryptedProfile: string) =>
    authed<{ saved: true }>('/api/vault/profile', { method: 'PUT', json: { encryptedProfile } }),
};

export interface RemoteDocument {
  id: string;
  cid: string;
  sizeBytes: number;
  wrappedKey: string;
  encryptedMetadata: string;
  createdAt: string;
  updatedAt: string;
}

export const documentsApi = {
  list: () => authed<{ documents: RemoteDocument[] }>('/api/documents'),
  /** `ciphertextFile` is a temp file holding the already-encrypted bytes. */
  upload: (ciphertextFile: File, wrappedKey: string, encryptedMetadata: string) => {
    const form = new FormData();
    form.append('file', ciphertextFile as unknown as Blob);
    form.append('wrappedKey', wrappedKey);
    form.append('encryptedMetadata', encryptedMetadata);
    return authed<{ document: RemoteDocument }>('/api/documents', { method: 'POST', body: form });
  },
  updateMetadata: (id: string, encryptedMetadata: string) =>
    authed<{ document: RemoteDocument }>(`/api/documents/${id}`, { method: 'PATCH', json: { encryptedMetadata } }),
  remove: (id: string) => authed<{ deleted: true }>(`/api/documents/${id}`, { method: 'DELETE' }),
};

export async function fetchFromIpfs(cid: string, timeoutMs = 30_000): Promise<Uint8Array> {
  let lastError: unknown = null;
  for (const gateway of IPFS_GATEWAYS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await expoFetch(`${gateway}${cid}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`${gateway} responded ${response.status}`);
      return await response.bytes();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new ApiRequestError(503, `Could not reach any IPFS gateway (${String(lastError)})`, 'IPFS_UNAVAILABLE');
}
