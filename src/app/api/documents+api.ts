import { requireUser } from '@/server/auth';
import { audit, db, toApiDocument, type DocumentRow } from '@/server/db';
import { MAX_UPLOAD_BYTES } from '@/server/env';
import { ApiError, json, requireString, route } from '@/server/http';
import { pinEncryptedFile, unpinFile } from '@/server/pinata';

export const GET = route(async (request) => {
  const user = await requireUser(request);
  const rows = (await db()`
    SELECT id, cid, size_bytes, wrapped_key, encrypted_metadata, created_at, updated_at
    FROM vault_documents
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC`) as DocumentRow[];
  return json({ documents: rows.map(toApiDocument) });
});

/**
 * Uploads an already-encrypted document.
 * multipart/form-data fields:
 *   file              : ciphertext blob (nonce || XChaCha20-Poly1305 output)
 *   wrappedKey        : document key wrapped with the user's master key
 *   encryptedMetadata : title/category/date/notes/etc. encrypted with the document key
 */
export const POST = route(async (request) => {
  const user = await requireUser(request);

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) {
    throw new ApiError(413, 'File is too large (max 25 MB)', 'TOO_LARGE');
  }

  // React Native's global FormData typings lack the server-side reader methods.
  let form: { get(name: string): Blob | string | null };
  try {
    form = (await request.formData()) as unknown as typeof form;
  } catch {
    throw new ApiError(400, 'Expected multipart/form-data', 'BAD_REQUEST');
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') throw new ApiError(400, 'file is required', 'BAD_REQUEST');
  if (file.size === 0) throw new ApiError(400, 'file is empty', 'BAD_REQUEST');
  if (file.size > MAX_UPLOAD_BYTES) throw new ApiError(413, 'File is too large (max 25 MB)', 'TOO_LARGE');

  const wrappedKey = requireString(form.get('wrappedKey'), 'wrappedKey', 1024);
  const encryptedMetadata = requireString(form.get('encryptedMetadata'), 'encryptedMetadata', 20_000);

  // Random, meaningless name: nothing about the patient leaks into IPFS metadata.
  const pinned = await pinEncryptedFile(file, `hv-${crypto.randomUUID()}.bin`);

  try {
    const rows = (await db()`
      INSERT INTO vault_documents (user_id, cid, pin_id, size_bytes, wrapped_key, encrypted_metadata)
      VALUES (${user.id}, ${pinned.cid}, ${pinned.id}, ${file.size}, ${wrappedKey}, ${encryptedMetadata})
      RETURNING id, cid, size_bytes, wrapped_key, encrypted_metadata, created_at, updated_at`) as DocumentRow[];
    await audit(user.id, 'document.create', rows[0].id);
    return json({ document: toApiDocument(rows[0]) }, 201);
  } catch (error) {
    await unpinFile(pinned.id);
    throw error;
  }
});
