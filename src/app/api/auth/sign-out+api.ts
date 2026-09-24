import { json, readJson, requireString, route } from '@/server/http';
import { signOut } from '@/server/neon-auth';

export const POST = route(async (request) => {
  const body = await readJson<{ sessionToken?: string }>(request);
  await signOut(requireString(body.sessionToken, 'sessionToken', 4096)).catch(() => {
    // The session may already be expired; signing out locally is what matters.
  });
  return json({ signedOut: true });
});
