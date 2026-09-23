import { createRemoteJWKSet, jwtVerify } from 'jose';

import { env } from './env';
import { ApiError } from './http';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  // jose caches the key set and refetches on unknown `kid`, so key rotation is handled.
  jwks ??= createRemoteJWKSet(new URL(`${env.neonAuthUrl()}/.well-known/jwks.json`));
  return jwks;
}

export interface AuthUser {
  id: string;
  email: string | null;
}

/**
 * Verifies the `Authorization: Bearer <jwt>` header against Neon Auth's JWKS
 * (EdDSA, 15-minute tokens) and returns the user. Throws 401 otherwise.
 */
export async function requireUser(request: Request): Promise<AuthUser> {
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new ApiError(401, 'Missing bearer token', 'UNAUTHENTICATED');

  const origin = new URL(env.neonAuthUrl()).origin;
  try {
    const { payload } = await jwtVerify(match[1], getJwks(), {
      issuer: origin,
      audience: origin,
      algorithms: ['EdDSA'],
    });
    if (!payload.sub) throw new Error('Token has no subject');
    return { id: payload.sub, email: typeof payload.email === 'string' ? payload.email : null };
  } catch {
    throw new ApiError(401, 'Invalid or expired token', 'UNAUTHENTICATED');
  }
}
