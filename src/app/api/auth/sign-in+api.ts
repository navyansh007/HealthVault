import { authResponse } from '@/server/auth-response';
import { readJson, requireString, route } from '@/server/http';
import { signInWithPassword } from '@/server/neon-auth';
import { requireEmail } from '@/server/validate';

export const POST = route(async (request) => {
  const body = await readJson<{ email?: string; password?: string }>(request);
  const email = requireEmail(body.email);
  const password = requireString(body.password, 'password', 128);
  return authResponse(await signInWithPassword(email, password));
});
