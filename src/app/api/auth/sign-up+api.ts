import { authResponse } from '@/server/auth-response';
import { readJson, requireString, route } from '@/server/http';
import { signUpWithPassword } from '@/server/neon-auth';
import { requireEmail, requirePassword } from '@/server/validate';

export const POST = route(async (request) => {
  const body = await readJson<{ email?: string; password?: string; name?: string }>(request);
  const email = requireEmail(body.email);
  const password = requirePassword(body.password);
  const name = requireString(body.name, 'name', 200).trim();
  return authResponse(await signUpWithPassword(email, password, name));
});
