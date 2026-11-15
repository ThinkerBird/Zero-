import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { streamBlobInBase64Chunks, NATIVE_SAVE_CHUNK_SIZE, sanitizeFilename } from './fileSave';

const sha256 = (u8: Uint8Array) => createHash('sha256').update(u8).digest('hex');

test('streamBlobInBase64Chunks streams multi-chunk binary blob losslessly with bounded chunk sizes', async () => {
  const totalBytes = NATIVE_SAVE_CHUNK_SIZE * 3 + 12345; // ~2.3 MB -> 4 chunks
  const raw = new Uint8Array(totalBytes);
  for (let i = 0; i < totalBytes; i += 4096) {
    raw[i] = (i >> 12) & 0xff;
  }
  const blob = new Blob([raw], { type: 'application/octet-stream' });

  const decodedParts: Buffer[] = [];
  let seenChunks = 0;
  const maxExpectedBase64Len = Math.ceil(NATIVE_SAVE_CHUNK_SIZE / 3) * 4;

  await streamBlobInBase64Chunks(blob, NATIVE_SAVE_CHUNK_SIZE, async (b64, index) => {
    assert.equal(index, seenChunks);
    assert.ok(b64.length <= maxExpectedBase64Len);
    decodedParts.push(Buffer.from(b64, 'base64'));
    seenChunks++;
  });

  assert.equal(seenChunks, 4);
  const reassembled = new Uint8Array(Buffer.concat(decodedParts));
  assert.equal(reassembled.byteLength, raw.byteLength);
  assert.equal(sha256(reassembled), sha256(raw));
});

test('streamBlobInBase64Chunks handles 0-byte blobs cleanly', async () => {
  const emptyBlob = new Blob([], { type: 'application/octet-stream' });
  const chunks: Array<{ b64: string; index: number }> = [];
  await streamBlobInBase64Chunks(emptyBlob, NATIVE_SAVE_CHUNK_SIZE, async (b64, index) => {
    chunks.push({ b64, index });
  });
  assert.deepEqual(chunks, [{ b64: '', index: 0 }]);
});

test('sanitizeFilename strips invalid path characters', () => {
  assert.equal(sanitizeFilename('../../secret/file:name*.encc'), '.._.._secret_file_name_.encc');
  assert.equal(sanitizeFilename(''), 'decrypted_file');
});
