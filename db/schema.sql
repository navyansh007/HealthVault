-- HealthVault schema. Idempotent: safe to re-run via `npm run db:migrate`.
--
-- Zero-knowledge by design: the server only ever stores ciphertext produced on
-- the patient's device plus the IPFS CID where the encrypted file is pinned.
-- `user_id` is the Neon Auth user id (JWT `sub`, neon_auth.user.id).

CREATE TABLE IF NOT EXISTS vault_keys (
  user_id             text PRIMARY KEY,
  -- Master key wrapped with a key derived from the user's recovery key.
  wrapped_master_key  text NOT NULL,
  key_version         integer NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_profiles (
  user_id            text PRIMARY KEY,
  encrypted_profile  text NOT NULL,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             text NOT NULL,
  cid                 text NOT NULL,
  pin_id              text NOT NULL,
  size_bytes          bigint NOT NULL,
  -- Per-document key, wrapped with the user's master key.
  wrapped_key         text NOT NULL,
  -- Title, category, dates, notes, mime type: all encrypted with the document key.
  encrypted_metadata  text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vault_documents_user_created_idx
  ON vault_documents (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS vault_audit_log (
  id           bigserial PRIMARY KEY,
  user_id      text NOT NULL,
  action       text NOT NULL,
  document_id  uuid,
  at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vault_audit_log_user_at_idx
  ON vault_audit_log (user_id, at DESC);
