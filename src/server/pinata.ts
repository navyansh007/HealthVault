/**
 * IPFS pinning via Pinata. Files are pinned to the *public* IPFS network:
 * they are content-addressed and retrievable from any IPFS gateway or node,
 * which is what makes storage decentralized. That is only safe because every
 * file is end-to-end encrypted on the patient's device before it gets here.
 */
import { env } from './env';
import { ApiError } from './http';

export interface PinnedFile {
  id: string;
  cid: string;
  size: number;
}

export async function pinEncryptedFile(file: Blob, name: string): Promise<PinnedFile> {
  const form = new FormData();
  form.append('file', file, name);
  form.append('network', 'public');
  form.append('name', name);
  const groupId = env.pinataGroupId();
  if (groupId) form.append('group_id', groupId);

  const response = await fetch('https://uploads.pinata.cloud/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.pinataJwt()}` },
    body: form,
  });

  if (!response.ok) {
    console.error('[pinata] upload failed', response.status, await response.text().catch(() => ''));
    throw new ApiError(502, 'Could not store the file on IPFS', 'STORAGE_UNAVAILABLE');
  }

  const { data } = (await response.json()) as { data: { id: string; cid: string; size: number } };
  return { id: data.id, cid: data.cid, size: data.size };
}

export async function unpinFile(pinId: string): Promise<void> {
  const response = await fetch(`https://api.pinata.cloud/v3/files/public/${encodeURIComponent(pinId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${env.pinataJwt()}` },
  });
  // Already gone is fine; anything else is logged but must not block deletion of the record.
  if (!response.ok && response.status !== 404) {
    console.error('[pinata] unpin failed', pinId, response.status, await response.text().catch(() => ''));
  }
}
