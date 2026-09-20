/**
 * End-to-end encryption for the vault. Everything here runs on the patient's
 * device; the server and IPFS only ever see the outputs.
 *
 * Key hierarchy
 *   Recovery key (shown once to the user, 160-bit random)
 *     └─ HKDF-SHA256 → KEK ── wraps ──▶ Master key (MK, 32 bytes, in SecureStore)
 *                                         ├─ wraps ──▶ Document key (DEK, random per document)
 *                                         │              ├─ encrypts the file   → pinned to IPFS
 *                                         │              └─ encrypts metadata   → Neon
 *                                         └─ encrypts the patient profile        → Neon
 *
 * Cipher: XChaCha20-Poly1305 (random 24-byte nonce, AEAD). Every sealed value is
 * `nonce || ciphertext+tag`, with a purpose-specific AAD so a blob of one kind
 * can't be swapped in for another.
 */
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { bytesToUtf8, concatBytes, utf8ToBytes } from '@noble/ciphers/utils.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { getRandomBytes } from 'expo-crypto';

const NONCE_BYTES = 24;
const KEY_BYTES = 32;
const RECOVERY_KEY_BYTES = 20;
const FORMAT = 'v1';

type Purpose = 'master-key' | 'document-key' | 'file' | 'metadata' | 'profile';

function aad(purpose: Purpose) {
  return utf8ToBytes(`healthvault:${FORMAT}:${purpose}`);
}

export class DecryptionError extends Error {
  constructor(message = 'Could not decrypt — wrong key or corrupted data') {
    super(message);
  }
}

export function sealBytes(key: Uint8Array, plaintext: Uint8Array, purpose: Purpose): Uint8Array {
  const nonce = getRandomBytes(NONCE_BYTES);
  return concatBytes(nonce, xchacha20poly1305(key, nonce, aad(purpose)).encrypt(plaintext));
}

export function openBytes(key: Uint8Array, sealed: Uint8Array, purpose: Purpose): Uint8Array {
  if (sealed.length <= NONCE_BYTES) throw new DecryptionError();
  try {
    return xchacha20poly1305(key, sealed.subarray(0, NONCE_BYTES), aad(purpose)).decrypt(sealed.subarray(NONCE_BYTES));
  } catch {
    throw new DecryptionError();
  }
}

/** Seal to a compact string: `v1.<base64>` (used for keys and JSON payloads). */
function sealToString(key: Uint8Array, plaintext: Uint8Array, purpose: Purpose) {
  return `${FORMAT}.${toBase64(sealBytes(key, plaintext, purpose))}`;
}

function openFromString(key: Uint8Array, sealed: string, purpose: Purpose) {
  const [version, body] = sealed.split('.', 2);
  if (version !== FORMAT || !body) throw new DecryptionError('Unsupported encryption format');
  return openBytes(key, fromBase64(body), purpose);
}

export function generateMasterKey() {
  return getRandomBytes(KEY_BYTES);
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** 160 random bits as 32 Crockford base32 chars, grouped `XXXX-XXXX-…` for writing down. */
export function generateRecoveryKey(): string {
  const bytes = getRandomBytes(RECOVERY_KEY_BYTES);
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return out.match(/.{4}/g)!.join('-');
}

export function normalizeRecoveryKey(input: string): string | null {
  const clean = input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (clean.length !== 32 || [...clean].some((c) => !CROCKFORD.includes(c))) return null;
  return clean.match(/.{4}/g)!.join('-');
}

function recoveryKeyToBytes(recoveryKey: string): Uint8Array {
  const clean = normalizeRecoveryKey(recoveryKey)?.replace(/-/g, '');
  if (!clean) throw new DecryptionError('That recovery key is not valid');
  const out = new Uint8Array(RECOVERY_KEY_BYTES);
  let bits = 0;
  let value = 0;
  let i = 0;
  for (const char of clean) {
    value = (value << 5) | CROCKFORD.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      out[i++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return out;
}

/** The recovery key is high-entropy random, so HKDF (not a slow password KDF) is sufficient. */
function deriveKek(recoveryKey: string, userId: string) {
  return hkdf(sha256, recoveryKeyToBytes(recoveryKey), utf8ToBytes('healthvault-recovery-kek'), utf8ToBytes(userId), KEY_BYTES);
}

export function wrapMasterKey(masterKey: Uint8Array, recoveryKey: string, userId: string) {
  return sealToString(deriveKek(recoveryKey, userId), masterKey, 'master-key');
}

export function unwrapMasterKey(wrapped: string, recoveryKey: string, userId: string) {
  try {
    return openFromString(deriveKek(recoveryKey, userId), wrapped, 'master-key');
  } catch {
    throw new DecryptionError('That recovery key does not match this account');
  }
}

export interface EncryptedDocument {
  ciphertext: Uint8Array;
  wrappedKey: string;
  encryptedMetadata: string;
}

export function encryptDocument<M>(masterKey: Uint8Array, file: Uint8Array, metadata: M): EncryptedDocument {
  const dek = getRandomBytes(KEY_BYTES);
  return {
    ciphertext: sealBytes(dek, file, 'file'),
    wrappedKey: sealToString(masterKey, dek, 'document-key'),
    encryptedMetadata: sealToString(dek, utf8ToBytes(JSON.stringify(metadata)), 'metadata'),
  };
}

export function unwrapDocumentKey(masterKey: Uint8Array, wrappedKey: string) {
  return openFromString(masterKey, wrappedKey, 'document-key');
}

export function encryptMetadata<M>(documentKey: Uint8Array, metadata: M) {
  return sealToString(documentKey, utf8ToBytes(JSON.stringify(metadata)), 'metadata');
}

export function decryptMetadata<M>(documentKey: Uint8Array, encryptedMetadata: string): M {
  return JSON.parse(bytesToUtf8(openFromString(documentKey, encryptedMetadata, 'metadata'))) as M;
}

export function decryptFile(documentKey: Uint8Array, ciphertext: Uint8Array) {
  return openBytes(documentKey, ciphertext, 'file');
}

export function encryptProfile<P>(masterKey: Uint8Array, profile: P) {
  return sealToString(masterKey, utf8ToBytes(JSON.stringify(profile)), 'profile');
}

export function decryptProfile<P>(masterKey: Uint8Array, encrypted: string): P {
  return JSON.parse(bytesToUtf8(openFromString(masterKey, encrypted, 'profile'))) as P;
}

export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
