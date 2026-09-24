import { ApiError, json, readJson, route } from '@/server/http';
import { sendEmailOtp } from '@/server/neon-auth';
import { requireEmail } from '@/server/validate';

const TYPES = ['sign-in', 'email-verification', 'forget-password'] as const;
type OtpType = (typeof TYPES)[number];

export const POST = route(async (request) => {
  const body = await readJson<{ email?: string; type?: string }>(request);
  const email = requireEmail(body.email);
  const type = (body.type ?? 'sign-in') as OtpType;
  if (!TYPES.includes(type)) throw new ApiError(400, 'Unknown OTP type', 'BAD_REQUEST');
  await sendEmailOtp(email, type);
  return json({ sent: true });
});
