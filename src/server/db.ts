import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

import { env } from './env';

let sql: NeonQueryFunction<false, false> | null = null;

/** Neon's HTTP driver: one round-trip per query, no pooled sockets to manage. */
export function db() {
  sql ??= neon(env.databaseUrl());
  return sql;
}

export interface DocumentRow {
  id: string;
  cid: string;
  size_bytes: number;
  wrapped_key: string;
  encrypted_metadata: string;
  created_at: string;
  updated_at: string;
}

export function toApiDocument(row: DocumentRow) {
  return {
    id: row.id,
    cid: row.cid,
    sizeBytes: Number(row.size_bytes),
    wrappedKey: row.wrapped_key,
    encryptedMetadata: row.encrypted_metadata,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function audit(userId: string, action: string, documentId: string | null = null) {
  try {
    await db()`INSERT INTO vault_audit_log (user_id, action, document_id) VALUES (${userId}, ${action}, ${documentId})`;
  } catch (error) {
    // Auditing must never block the user's request.
    console.error('[audit] failed to record', action, error);
  }
}
