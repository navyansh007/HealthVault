import { json } from './http';
import type { AuthSessionPayload } from './neon-auth';

/**
 * 200 with a session, or 202 when Neon Auth created the account but wants the
 * email verified first (the app then shows the verification-code screen).
 */
export function authResponse(session: AuthSessionPayload | null) {
  if (!session) return json({ status: 'verification_required' }, 202);
  return json({ status: 'signed_in', ...session });
}
