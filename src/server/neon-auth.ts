/**
 * Thin server-side proxy to Neon Auth (Managed Better Auth).
 *
 * Neon Auth is cookie-based and built for browsers. The native app can't rely
 * on a cookie jar, so our API routes talk to Neon Auth on its behalf and hand
 * the app two things:
 *   - `sessionToken`: the opaque session cookie (`name=value`), long-lived,
 *     kept in SecureStore and only ever sent back to /api/auth/*.
 *   - `accessToken`: a 15-minute EdDSA JWT sent as a Bearer token to every
 *     other API route and verified locally against Neon Auth's JWKS.
 */
import { env } from './env';
import { ApiError } from './http';

export interface NeonAuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface AuthSessionPayload {
  sessionToken: string;
  accessToken: string;
  user: NeonAuthUser;
}

interface CallResult<T> {
  data: T;
  sessionCookie: string | null;
}

function extractSessionCookie(response: Response): string | null {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const cookies =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : (response.headers.get('set-cookie') ?? '').split(/,(?=\s*[^;,=\s]+=[^;,]*)/);

  for (const cookie of cookies) {
    const pair = cookie.split(';')[0]?.trim();
    if (!pair) continue;
    const eq = pair.indexOf('=');
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    // Better Auth names it `<prefix>.session_token`; an empty value means "cleared".
    if (name.endsWith('session_token') && value) return pair;
  }
  return null;
}

async function call<T>(
  path: string,
  { method = 'POST', body, sessionToken }: { method?: 'GET' | 'POST'; body?: unknown; sessionToken?: string } = {},
): Promise<CallResult<T>> {
  const headers: Record<string, string> = { Origin: env.neonAuthOrigin(), Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (sessionToken) headers.Cookie = sessionToken;

  let response: Response;
  try {
    response = await fetch(`${env.neonAuthUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    console.error('[neon-auth] network error', path, error);
    throw new ApiError(502, 'Authentication service is unreachable', 'AUTH_UNAVAILABLE');
  }

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const status = response.status >= 500 ? 502 : response.status;
    throw new ApiError(status, data?.message ?? 'Authentication failed', data?.code ?? 'AUTH_ERROR');
  }

  return { data: data as T, sessionCookie: extractSessionCookie(response) };
}

export async function issueAccessToken(sessionToken: string): Promise<string> {
  const { data } = await call<{ token?: string }>('/token', { method: 'GET', sessionToken });
  if (!data?.token) throw new ApiError(401, 'Session expired — please sign in again', 'SESSION_EXPIRED');
  return data.token;
}

async function toSession(result: CallResult<{ user?: NeonAuthUser }>): Promise<AuthSessionPayload | null> {
  if (!result.sessionCookie || !result.data?.user) return null;
  const accessToken = await issueAccessToken(result.sessionCookie);
  const { id, email, name, emailVerified } = result.data.user;
  return { sessionToken: result.sessionCookie, accessToken, user: { id, email, name, emailVerified } };
}

export async function signUpWithPassword(email: string, password: string, name: string) {
  // When "Verify at sign-up" is on, Neon Auth creates the user but no session.
  return toSession(await call('/sign-up/email', { body: { email, password, name } }));
}

export async function signInWithPassword(email: string, password: string) {
  return toSession(await call('/sign-in/email', { body: { email, password } }));
}

export async function sendEmailOtp(email: string, type: 'sign-in' | 'email-verification' | 'forget-password') {
  await call('/email-otp/send-verification-otp', { body: { email, type } });
}

export async function signInWithEmailOtp(email: string, otp: string) {
  return toSession(await call('/sign-in/email-otp', { body: { email, otp } }));
}

export async function verifyEmailWithOtp(email: string, otp: string) {
  return toSession(await call('/email-otp/verify-email', { body: { email, otp } }));
}

export async function resetPasswordWithOtp(email: string, otp: string, password: string) {
  await call('/email-otp/reset-password', { body: { email, otp, password } });
}

export async function getSessionUser(sessionToken: string): Promise<NeonAuthUser | null> {
  const { data } = await call<{ user?: NeonAuthUser } | null>('/get-session', { method: 'GET', sessionToken });
  return data?.user ?? null;
}

export async function signOut(sessionToken: string) {
  await call('/sign-out', { sessionToken, body: {} });
}
