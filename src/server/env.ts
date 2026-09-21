import { ApiError } from './http';

// Env vars are read with literal `process.env.X` access so bundlers can see them.
function required(name: string, value: string | undefined): string {
  if (!value) throw new ApiError(500, `Server misconfigured: ${name} is not set`, 'MISCONFIGURED');
  return value;
}

export const env = {
  databaseUrl: () => required('DATABASE_URL', process.env.DATABASE_URL),
  /** Neon Auth URL from Console → Auth, e.g. https://ep-xxx.neonauth.<region>.aws.neon.tech/neondb/auth */
  neonAuthUrl: () => required('NEON_AUTH_URL', process.env.NEON_AUTH_URL).replace(/\/$/, ''),
  /**
   * Origin sent to Neon Auth on server-to-server calls. Must be a trusted domain
   * in Console → Auth → Domains. Development falls back to the local dev server,
   * which Neon Auth trusts by default.
   */
  neonAuthOrigin: () =>
    process.env.NODE_ENV === 'production'
      ? required('NEON_AUTH_ORIGIN', process.env.NEON_AUTH_ORIGIN)
      : process.env.NEON_AUTH_ORIGIN || 'http://localhost:8081',
  /** Pinata JWT with org:files:write scope. */
  pinataJwt: () => required('PINATA_JWT', process.env.PINATA_JWT),
  pinataGroupId: () => process.env.PINATA_GROUP_ID || undefined,
};

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
