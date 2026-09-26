import { requireUser } from '@/server/auth';
import { audit, db, toApiDocument, type DocumentRow } from '@/server/db';
import { ApiError, json, readJson, requireString, requireUuid, route } from '@/server/http';
import { unpinFile } from '@/server/pinata';

type Params = { id: string };

export const GET = route<Params>(async (request, { id }) => {
  const user = await requireUser(request);
  const rows = (await db()`
    SELECT id, cid, size_bytes, wrapped_key, encrypted_metadata, created_at, updated_at
    FROM vault_documents
    WHERE id = ${requireUuid(id, 'id')} AND user_id = ${user.id}`) as DocumentRow[];
  if (rows.length === 0) throw new ApiError(404, 'Document not found', 'NOT_FOUND');
  await audit(user.id, 'document.read', rows[0].id);
  return json({ document: toApiDocument(rows[0]) });
});

export const PATCH = route<Params>(async (request, { id }) => {
  const user = await requireUser(request);
  const body = await readJson<{ encryptedMetadata?: string }>(request);
  const encryptedMetadata = requireString(body.encryptedMetadata, 'encryptedMetadata', 20_000);
  const rows = (await db()`
    UPDATE vault_documents
    SET encrypted_metadata = ${encryptedMetadata}, updated_at = now()
    WHERE id = ${requireUuid(id, 'id')} AND user_id = ${user.id}
    RETURNING id, cid, size_bytes, wrapped_key, encrypted_metadata, created_at, updated_at`) as DocumentRow[];
  if (rows.length === 0) throw new ApiError(404, 'Document not found', 'NOT_FOUND');
  await audit(user.id, 'document.update', rows[0].id);
  return json({ document: toApiDocument(rows[0]) });
});

/**
 * Deletes the record and unpins the ciphertext. Copies cached by other IPFS
 * nodes may persist for a while, but without the wrapped key (now gone) they
 * are undecryptable.
 */
export const DELETE = route<Params>(async (request, { id }) => {
  const user = await requireUser(request);
  const rows = await db()`
    DELETE FROM vault_documents
    WHERE id = ${requireUuid(id, 'id')} AND user_id = ${user.id}
    RETURNING id, pin_id`;
  if (rows.length === 0) throw new ApiError(404, 'Document not found', 'NOT_FOUND');
  await unpinFile(rows[0].pin_id);
  await audit(user.id, 'document.delete', rows[0].id);
  return json({ deleted: true });
});
