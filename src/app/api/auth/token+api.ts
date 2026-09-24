import { json, readJson, requireString, route } from '@/server/http';
import { getSessionUser, issueAccessToken } from '@/server/neon-auth';

export const POST = route(async (request) => {
  const body = await readJson<{ sessionToken?: string }>(request);
  const sessionToken = requireString(body.sessionToken, 'sessionToken', 4096);
  const [accessToken, user] = await Promise.all([issueAccessToken(sessionToken), getSessionUser(sessionToken)]);
  return json({ accessToken, user });
});
