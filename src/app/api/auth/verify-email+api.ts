import { authResponse } from '@/server/auth-response';
import { readJson, route } from '@/server/http';
import { verifyEmailWithOtp } from '@/server/neon-auth';
import { requireEmail, requireOtp } from '@/server/validate';

export const POST = route(async (request) => {
  const body = await readJson<{ email?: string; otp?: string }>(request);
  return authResponse(await verifyEmailWithOtp(requireEmail(body.email), requireOtp(body.otp)));
});
