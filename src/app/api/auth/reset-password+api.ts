import { json, readJson, route } from '@/server/http';
import { resetPasswordWithOtp } from '@/server/neon-auth';
import { requireEmail, requireOtp, requirePassword } from '@/server/validate';

export const POST = route(async (request) => {
  const body = await readJson<{ email?: string; otp?: string; password?: string }>(request);
  await resetPasswordWithOtp(requireEmail(body.email), requireOtp(body.otp), requirePassword(body.password));
  return json({ reset: true });
});
