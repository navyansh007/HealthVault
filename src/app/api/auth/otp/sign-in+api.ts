import { authResponse } from '@/server/auth-response';
import { readJson, route } from '@/server/http';
import { signInWithEmailOtp } from '@/server/neon-auth';
import { requireEmail, requireOtp } from '@/server/validate';

export const POST = route(async (request) => {
  const body = await readJson<{ email?: string; otp?: string }>(request);
  return authResponse(await signInWithEmailOtp(requireEmail(body.email), requireOtp(body.otp)));
});
