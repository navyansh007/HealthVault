import { requireUser } from '@/server/auth';
import { db } from '@/server/db';
import { json, readJson, requireString, route } from '@/server/http';

export const GET = route(async (request) => {
  const user = await requireUser(request);
  const rows = await db()`SELECT encrypted_profile, updated_at FROM vault_profiles WHERE user_id = ${user.id}`;
  if (rows.length === 0) return json({ encryptedProfile: null });
  return json({ encryptedProfile: rows[0].encrypted_profile, updatedAt: new Date(rows[0].updated_at).toISOString() });
});

export const PUT = route(async (request) => {
  const user = await requireUser(request);
  const body = await readJson<{ encryptedProfile?: string }>(request);
  const encrypted = requireString(body.encryptedProfile, 'encryptedProfile', 20_000);
  await db()`
    INSERT INTO vault_profiles (user_id, encrypted_profile) VALUES (${user.id}, ${encrypted})
    ON CONFLICT (user_id) DO UPDATE SET encrypted_profile = EXCLUDED.encrypted_profile, updated_at = now()`;
  return json({ saved: true });
});
