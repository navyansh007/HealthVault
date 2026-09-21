import { ApiError, requireString } from './http';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireEmail(value: unknown): string {
  const email = requireString(value, 'email', 320).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Enter a valid email address', 'BAD_REQUEST');
  return email;
}

export function requirePassword(value: unknown): string {
  const password = requireString(value, 'password', 128);
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters', 'WEAK_PASSWORD');
  return password;
}

export function requireOtp(value: unknown): string {
  const otp = requireString(value, 'otp', 12).trim();
  if (!/^\d{4,10}$/.test(otp)) throw new ApiError(400, 'Enter the code from your email', 'BAD_REQUEST');
  return otp;
}
