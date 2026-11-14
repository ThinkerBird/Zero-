import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateKeyfile,
  encryptFile,
  decryptFile,
  encryptText,
  decryptText,
  deriveKey,
  LEGACY_PBKDF2_ITERATIONS,
  STREAM_CHUNK_SIZE,
} from './crypto';

function deriveChunkIvForTest(baseIv: Uint8Array, chunkIndex: number): Uint8Array {
  const chunkIv = new Uint8Array(12);
  chunkIv.set(baseIv);
  const dataView = new DataView(chunkIv.buffer);
  const currentVal = dataView.getUint32(8, true);
  dataView.setUint32(8, currentVal ^ chunkIndex, true);
  return chunkIv;
}

async function buildLegacyV3File(
  plainBytes: Uint8Array,
  filename: string,
  mimeType: string,
  password: string,
  encryptedAtValue: number,
  iterations = LEGACY_PBKDF2_ITERATIONS
): Promise<File> {
  const MAGIC_V3 = new Uint8Array([0x5A, 0x45, 0x52, 0x4F, 0x03, 0x00]);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const baseIv = crypto.getRandomValues(new Uint8Array(12));
  const chunkSize = STREAM_CHUNK_SIZE;
  const key = await deriveKey(password, salt, ['encrypt'], null, iterations);

  const metadata = {
    name: filename,
    type: mimeType,
    compressed: false,
    size: plainBytes.byteLength,
    encryptedAt: encryptedAtValue,
    version: 3,
    chunked: true,
    chunkSize,
  };
  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const metadataLength = metadataBytes.length;

  const headerSize = 18 + metadataLength + 16 + 12;
  const headerBuffer = new ArrayBuffer(headerSize);
  const headerView = new DataView(headerBuffer);
  const headerArray = new Uint8Array(headerBuffer);

  headerArray.set(MAGIC_V3, 0);
  headerView.setUint32(6, iterations, true);
  headerView.setUint32(10, chunkSize, true);
  headerView.setUint32(14, metadataLength, true);
  headerArray.set(metadataBytes, 18);
  headerArray.set(salt, 18 + metadataLength);
  headerArray.set(baseIv, 18 + metadataLength + 16);

  const aad = new Uint8Array(5);
  const aadView = new DataView(aad.buffer);
  aadView.setUint32(0, 0, true);
  aadView.setUint8(4, 1);

  const encChunk = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: deriveChunkIvForTest(baseIv, 0) as unknown as BufferSource,
      additionalData: aad as unknown as BufferSource,
    },
    key,
    plainBytes as unknown as BufferSource
  );

  const lenBuf = new ArrayBuffer(4);
  new DataView(lenBuf).setUint32(0, encChunk.byteLength, true);

  return new File([headerBuffer, lenBuf, encChunk], `${filename}.encc`, {
    type: 'application/octet-stream',
  });
}

async function expectExactDecryptionFailed(promise: Promise<unknown>, context: string): Promise<void> {
  let caught: unknown = null;
  try {
    await promise;
  } catch (err) {
    caught = err;
  }
  assert.ok(caught instanceof Error, `Expected error for ${context}, but succeeded`);
  assert.equal(caught.message, 'Decryption failed', `Unexpected error message for ${context}: ${caught.message}`);
}

test('generateKeyfile produces CSPRNG 32-byte payload and [a-z0-9]{8}.key filename without timestamp or vault wording', async () => {
  const names = new Set<string>();
  const nowBase36 = Date.now().toString(36).slice(0, 5);

  for (let i = 0; i < 20; i++) {
    const { blob, fileName } = generateKeyfile();
    assert.match(fileName, /^[a-z0-9]{8}\.key$/);
    assert.equal(fileName.startsWith('vault-'), false);
    assert.equal(fileName.includes(nowBase36), false);
    assert.equal(blob.size, 32);

    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.equal(bytes.length, 32);
    assert.equal(bytes.some((b) => b !== 0), true);
    names.add(fileName);
  }

  assert.equal(names.size, 20);
});

test('v4 encryptFile / decryptFile round trip works with password, keyfile-only, and password + keyfile 2FA', async () => {
  const originalContent = new TextEncoder().encode('Zero-knowledge test payload without any timestamps.');
  const originalFile = new File([originalContent], 'confidential-report-2026.txt', {
    type: 'text/plain',
  });

  // Password only
  const { blob, fileName } = await encryptFile(originalFile, 'CorrectHorseBatteryStaple!');
  assert.equal(fileName, 'confidential-report-2026.txt.encc');

  const encryptedFile = new File([blob], fileName, { type: 'application/octet-stream' });
  const decryptedFile = await decryptFile(encryptedFile, 'CorrectHorseBatteryStaple!');
  assert.equal(decryptedFile.name, 'confidential-report-2026.txt');
  assert.equal(decryptedFile.type, 'text/plain');
  assert.deepEqual(new Uint8Array(await decryptedFile.arrayBuffer()), originalContent);

  // Wrong password fails with exact "Decryption failed"
  await expectExactDecryptionFailed(
    decryptFile(encryptedFile, 'WrongPassword!'),
    'wrong password'
  );

  // Keyfile only
  const { blob: keyfileBlob } = generateKeyfile();
  const keyfileBuffer = await keyfileBlob.arrayBuffer();
  const { blob: kfOnlyBlob, fileName: kfOnlyName } = await encryptFile(
    originalFile,
    '',
    undefined,
    keyfileBuffer
  );
  const kfOnlyDecrypted = await decryptFile(
    new File([kfOnlyBlob], kfOnlyName, { type: 'application/octet-stream' }),
    '',
    undefined,
    keyfileBuffer
  );
  assert.equal(kfOnlyDecrypted.name, 'confidential-report-2026.txt');
  assert.deepEqual(new Uint8Array(await kfOnlyDecrypted.arrayBuffer()), originalContent);

  // Password + Keyfile 2FA
  const { blob: dualBlob, fileName: dualName } = await encryptFile(
    originalFile,
    'SecondFactorPass!',
    undefined,
    keyfileBuffer
  );
  const dualEncrypted = new File([dualBlob], dualName, { type: 'application/octet-stream' });

  await expectExactDecryptionFailed(
    decryptFile(dualEncrypted, 'SecondFactorPass!'),
    'missing keyfile'
  );

  const dualDecrypted = await decryptFile(
    dualEncrypted,
    'SecondFactorPass!',
    undefined,
    keyfileBuffer
  );
  assert.equal(dualDecrypted.name, 'confidential-report-2026.txt');
  assert.deepEqual(new Uint8Array(await dualDecrypted.arrayBuffer()), originalContent);
});

test('v4 encryptFile / decryptFile handles empty (0-byte) files', async () => {
  const emptyFile = new File([new Uint8Array(0)], 'empty-note.md', { type: 'text/markdown' });
  const { blob, fileName } = await encryptFile(emptyFile, 'EmptyFilePass123!');
  const encryptedFile = new File([blob], fileName, { type: 'application/octet-stream' });
  const restored = await decryptFile(encryptedFile, 'EmptyFilePass123!');

  assert.equal(restored.name, 'empty-note.md');
  assert.equal(restored.size, 0);
});

test('v4 encrypted output header and first 200 bytes contain no filename, encryptedAt, or date strings', async () => {
  const secretName = 'secret-tax-return-2026-11-13.pdf';
  const payload = new TextEncoder().encode('Confidential financial numbers 1234567890');
  const sourceFile = new File([payload], secretName, { type: 'application/pdf' });

  const { blob } = await encryptFile(sourceFile, 'HeaderInspectionPass!');
  const allBytes = new Uint8Array(await blob.arrayBuffer());
  const first200 = allBytes.slice(0, Math.min(200, allBytes.length));

  // Verify V4 magic header ZERO\x04\x00
  assert.deepEqual(Array.from(first200.slice(0, 6)), [0x5A, 0x45, 0x52, 0x4F, 0x04, 0x00]);

  const first200Latin1 = Buffer.from(first200).toString('latin1');
  const allLatin1 = Buffer.from(allBytes).toString('latin1');
  const currentYear = String(new Date().getFullYear());

  assert.equal(allLatin1.includes(secretName), false);
  assert.equal(allLatin1.includes('secret-tax-return'), false);
  assert.equal(allLatin1.includes('encryptedAt'), false);
  assert.equal(first200Latin1.includes(currentYear), false);
  assert.equal(first200Latin1.includes('2026'), false);
  assert.equal(first200Latin1.includes('application/pdf'), false);
});

test('flipping EVERY byte (0..41) of the 42-byte V4 header fails with exact "Decryption failed"', async () => {
  const source = new File([new TextEncoder().encode('Header authentication coverage test bytes.')], 'hdr.txt', {
    type: 'text/plain',
  });
  const { blob } = await encryptFile(source, 'HeaderAuthPass!');
  const orig = new Uint8Array(await blob.arrayBuffer());

  for (let i = 0; i < 42; i++) {
    const tampered = orig.slice();
    tampered[i] ^= 0x01;
    await expectExactDecryptionFailed(
      decryptFile(new File([tampered], 'hdr.txt.encc'), 'HeaderAuthPass!'),
      `header byte index ${i}`
    );
  }
});

test('tampered iterations and chunkSize out of bounds fail fast without running PBKDF2', async () => {
  const source = new File([new TextEncoder().encode('Bounds validation test bytes.')], 'bounds.txt', {
    type: 'text/plain',
  });
  const { blob } = await encryptFile(source, 'BoundsPass!');
  const orig = new Uint8Array(await blob.arrayBuffer());

  const invalidIterations = [0, 599999, 10000001, 0xffffffff];
  for (const iter of invalidIterations) {
    const tampered = orig.slice();
    new DataView(tampered.buffer).setUint32(6, iter, true);
    const t0 = performance.now();
    await expectExactDecryptionFailed(
      decryptFile(new File([tampered], 'bounds.txt.encc'), 'BoundsPass!'),
      `iterations=${iter}`
    );
    const elapsedMs = performance.now() - t0;
    assert.ok(elapsedMs < 100, `Expected fast fail for iterations=${iter}, took ${elapsedMs.toFixed(1)}ms`);
  }

  const invalidChunkSizes = [0, 64 * 1024 - 1, 16 * 1024 * 1024 + 1, 0xffffffff];
  for (const cs of invalidChunkSizes) {
    const tampered = orig.slice();
    new DataView(tampered.buffer).setUint32(10, cs, true);
    const t0 = performance.now();
    await expectExactDecryptionFailed(
      decryptFile(new File([tampered], 'bounds.txt.encc'), 'BoundsPass!'),
      `chunkSize=${cs}`
    );
    const elapsedMs = performance.now() - t0;
    assert.ok(elapsedMs < 100, `Expected fast fail for chunkSize=${cs}, took ${elapsedMs.toFixed(1)}ms`);
  }
});

test('all multi-chunk tamper cases fail with exact "Decryption failed"', async () => {
  const big = new Uint8Array(4 * 1024 * 1024 + 512);
  for (let i = 0; i < big.length; i += 4096) big[i] = (i >> 12) & 0xff;
  const { blob: kfBlob } = generateKeyfile();
  const kfBuf = await kfBlob.arrayBuffer();
  const { blob: wrongKfBlob } = generateKeyfile();
  const wrongKfBuf = await wrongKfBlob.arrayBuffer();

  const enc = await encryptFile(new File([big], 'multi.bin', { type: 'application/octet-stream' }), 'RightPass!', undefined, kfBuf);
  const encBytes = new Uint8Array(await enc.blob.arrayBuffer());

  const dv = new DataView(encBytes.buffer);
  let off = 42;
  const chunks: Array<{ start: number; end: number }> = [];
  while (off < encBytes.length) {
    const len = dv.getUint32(off, true);
    chunks.push({ start: off, end: off + 4 + len });
    off += 4 + len;
  }

  await expectExactDecryptionFailed(decryptFile(new File([encBytes], 'm.encc'), 'WrongPass!', undefined, kfBuf), 'wrong password');
  await expectExactDecryptionFailed(decryptFile(new File([encBytes], 'm.encc'), 'RightPass!', undefined, wrongKfBuf), 'wrong keyfile');
  await expectExactDecryptionFailed(decryptFile(new File([encBytes], 'm.encc'), 'RightPass!', undefined, null), 'missing keyfile');

  const metaFlip = encBytes.slice();
  metaFlip[50] ^= 0xff;
  await expectExactDecryptionFailed(decryptFile(new File([metaFlip], 'm.encc'), 'RightPass!', undefined, kfBuf), 'metadata flip');

  const chunkFlip = encBytes.slice();
  chunkFlip[chunks[1].start + 16] ^= 0xff;
  await expectExactDecryptionFailed(decryptFile(new File([chunkFlip], 'm.encc'), 'RightPass!', undefined, kfBuf), 'chunk flip');

  const truncated = encBytes.slice(0, chunks[chunks.length - 1].start);
  await expectExactDecryptionFailed(decryptFile(new File([truncated], 'm.encc'), 'RightPass!', undefined, kfBuf), 'truncate last chunk');

  const swapped = new Uint8Array(encBytes.length);
  swapped.set(encBytes.slice(0, 42), 0);
  let p = 42;
  const c0 = encBytes.slice(chunks[0].start, chunks[0].end);
  const c1 = encBytes.slice(chunks[1].start, chunks[1].end);
  const c2 = encBytes.slice(chunks[2].start, chunks[2].end);
  swapped.set(c0, p); p += c0.length;
  swapped.set(c2, p); p += c2.length;
  swapped.set(c1, p); p += c1.length;
  for (let i = 3; i < chunks.length; i++) {
    const ci = encBytes.slice(chunks[i].start, chunks[i].end);
    swapped.set(ci, p);
    p += ci.length;
  }
  await expectExactDecryptionFailed(decryptFile(new File([swapped], 'm.encc'), 'RightPass!', undefined, kfBuf), 'swap chunks');

  const appended = new Uint8Array(encBytes.length + 16);
  appended.set(encBytes, 0);
  await expectExactDecryptionFailed(decryptFile(new File([appended], 'm.encc'), 'RightPass!', undefined, kfBuf), 'append extra bytes');
});

test('old v3 file containing encryptedAt still decrypts, ignores encryptedAt, and fails generically', async () => {
  const historicalTimestamp = 1700000000000;
  const legacyPlainBytes = new TextEncoder().encode('Legacy V3 archived document body.');
  const v3File = await buildLegacyV3File(
    legacyPlainBytes,
    'legacy-secret.txt',
    'text/plain',
    'LegacyV3Password!',
    historicalTimestamp
  );

  const restored = await decryptFile(v3File, 'LegacyV3Password!');
  assert.equal(restored.name, 'legacy-secret.txt');
  assert.equal(restored.type, 'text/plain');
  assert.notEqual(restored.lastModified, historicalTimestamp);
  assert.deepEqual(new Uint8Array(await restored.arrayBuffer()), legacyPlainBytes);

  await expectExactDecryptionFailed(decryptFile(v3File, 'WrongLegacyPassword!'), 'v3 wrong password');
});

test('encryptText / decryptText round trip succeeds without encryptedAt and fails generically', async () => {
  const cipher = await encryptText('Sensitive note text', 'TextPassphrase99!');
  assert.equal(cipher.startsWith('ZERO:v2:'), true);
  assert.equal(cipher.includes('encryptedAt'), false);

  const plain = await decryptText(cipher, 'TextPassphrase99!');
  assert.equal(plain, 'Sensitive note text');

  await expectExactDecryptionFailed(decryptText(cipher, 'WrongTextPass!'), 'decryptText wrong password');
  await expectExactDecryptionFailed(decryptText('ZERO:v2:invalid!!', 'TextPassphrase99!'), 'decryptText invalid base64');
});
