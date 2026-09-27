/**
 * Local file handling. Plaintext only ever lives in a dedicated cache folder
 * that is wiped when the vault locks or the user signs out.
 */
import { Directory, File, Paths } from 'expo-file-system';

const PLAINTEXT_DIR = 'hv-decrypted';
const UPLOAD_DIR = 'hv-upload';

function dir(name: string) {
  const d = new Directory(Paths.cache, name);
  if (!d.exists) d.create({ intermediates: true });
  return d;
}

export async function readFileBytes(uri: string): Promise<Uint8Array> {
  return new File(uri).bytes();
}

/** Writes ciphertext to a temp file so it can be streamed as a multipart upload. */
export function writeUploadTemp(bytes: Uint8Array): File {
  const file = new File(dir(UPLOAD_DIR), `${Date.now()}-${Math.random().toString(36).slice(2)}.bin`);
  file.create({ overwrite: true });
  file.write(bytes);
  return file;
}

export function deleteQuietly(file: File) {
  try {
    if (file.exists) file.delete();
  } catch {
    // Cache cleanup is best-effort.
  }
}

export function writeDecryptedFile(documentId: string, extension: string, bytes: Uint8Array): string {
  const file = new File(dir(PLAINTEXT_DIR), `${documentId}.${extension}`);
  file.create({ overwrite: true });
  file.write(bytes);
  return file.uri;
}

export function clearPlaintextCache() {
  for (const name of [PLAINTEXT_DIR, UPLOAD_DIR]) {
    try {
      const d = new Directory(Paths.cache, name);
      if (d.exists) d.delete();
    } catch {
      // Cache cleanup is best-effort.
    }
  }
}
