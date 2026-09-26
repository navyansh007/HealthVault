import { requireUser } from '@/server/auth';
import { audit, db } from '@/server/db';
import { ApiError, json, readJson, requireString, route } from '@/server/http';

export const GET = route(async (request) => {
  const user = await requireUser(request);
  const rows = await db()`
    SELECT wrapped_master_key, key_version FROM vault_keys WHERE user_id = ${user.id}`;
  if (rows.length === 0) return json({ wrappedMasterKey: null });
  return json({ wrappedMasterKey: rows[0].wrapped_master_key, keyVersion: rows[0].key_version });
});

/**
 * Creates the vault key once. Re-wrapping (e.g. rotating the recovery key)
 * must send `replace: true` so a second device can't silently clobber it.
 */
export const PUT = route(async (request) => {
  const user = await requireUser(request);
  const body = await readJson<{ wrappedMasterKey?: string; replace?: boolean }>(request);
  const wrapped = requireString(body.wrappedMasterKey, 'wrappedMasterKey', 1024);

  const rows = body.replace
    ? await db()`
        INSERT INTO vault_keys (user_id, wrapped_master_key) VALUES (${user.id}, ${wrapped})
        ON CONFLICT (user_id) DO UPDATE
          SET wrapped_master_key = EXCLUDED.wrapped_master_key,
              key_version = vault_keys.key_version + 1,
              updated_at = now()
        RETURNING key_version`
    : await db()`
        INSERT INTO vault_keys (user_id, wrapped_master_key) VALUES (${user.id}, ${wrapped})
        ON CONFLICT (user_id) DO NOTHING
        RETURNING key_version`;

  if (rows.length === 0) throw new ApiError(409, 'A vault key already exists for this account', 'KEY_EXISTS');
  await audit(user.id, body.replace ? 'vault_key.rotate' : 'vault_key.create');
  return json({ keyVersion: rows[0].key_version });
});
