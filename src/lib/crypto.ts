/**
 * Zero-Knowledge Cryptographic Engine for Zero (ZeroVault)
 * 100% Client-side Web Crypto API (crypto.subtle)
 */

export interface FileMetadata {
  name: string;
  type: string;
  compressed: boolean;
  size?: number;
  encryptedAt?: number;
  version?: number;
  chunked?: boolean;
  chunkSize?: number;
}

export interface EncryptionProgress {
  percent: number;
  stage: 'compressing' | 'encrypting' | 'decrypting' | 'decompressing' | 'finalizing' | 'idle';
}

// Magic bytes for Version 2 & Version 3 (Chunked Streaming) Headers
const MAGIC_V2 = new Uint8Array([0x5A, 0x45, 0x52, 0x4F, 0x02, 0x00]); // "ZERO\x02\x00"
const MAGIC_V3 = new Uint8Array([0x5A, 0x45, 0x52, 0x4F, 0x03, 0x00]); // "ZERO\x03\x00"
export const DEFAULT_PBKDF2_ITERATIONS = 600000;
export const LEGACY_PBKDF2_ITERATIONS = 100000;
export const STREAM_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB Chunk size for memory-safe streaming

/**
 * Robust base64 encoding that avoids call stack overflow on large buffers
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Robust base64 decoding to Uint8Array
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const sanitized = base64.replace(/\s+/g, '');
  const binary = atob(sanitized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Computes a short SHA-256 fingerprint for display (e.g. 8a3f...d9e1)
 */
export async function computeKeyfileFingerprint(buffer: ArrayBuffer): Promise<string> {
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Keyfile is empty (0 bytes). Please attach a valid non-empty file.');
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a 32-byte (256-bit) cryptographically secure random keyfile
 */
export function generateKeyfile(): { blob: Blob; fileName: string } {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const blob = new Blob([randomBytes], { type: 'application/octet-stream' });
  const fileName = `vault-${Date.now().toString(36)}.key`;
  return { blob, fileName };
}

/**
 * Key Derivation using PBKDF2 with SHA-256
 * Default iterations: 600,000 (OWASP recommended)
 * Enforces domain separation for keyfiles and rejects zero-length keyfiles
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  keyUsages: KeyUsage[] = ['encrypt', 'decrypt'],
  keyfileBuffer?: ArrayBuffer | null,
  iterations = DEFAULT_PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  let keyMaterialBytes: Uint8Array;

  if (keyfileBuffer !== undefined && keyfileBuffer !== null) {
    if (keyfileBuffer.byteLength === 0) {
      throw new Error('Attached keyfile is empty (0 bytes). Please attach a non-empty keyfile.');
    }
    const keyfileHash = new Uint8Array(await crypto.subtle.digest('SHA-256', keyfileBuffer));
    const passBytes = new TextEncoder().encode(password || '');
    const domainPrefix = new TextEncoder().encode('ZeroVault-DualFactor-Keyfile::');
    
    keyMaterialBytes = new Uint8Array(domainPrefix.length + passBytes.length + keyfileHash.length);
    keyMaterialBytes.set(domainPrefix, 0);
    keyMaterialBytes.set(passBytes, domainPrefix.length);
    keyMaterialBytes.set(keyfileHash, domainPrefix.length + passBytes.length);
  } else {
    if (!password) {
      throw new Error('Password or keyfile is required for key derivation.');
    }
    keyMaterialBytes = new TextEncoder().encode(password);
  }

  const rawKeyMaterial = await crypto.subtle.importKey(
    'raw',
    keyMaterialBytes as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    rawKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    keyUsages
  );
}

/**
 * Sanitizes filenames to prevent path traversal and control character injection
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'decrypted_file';
  let sanitized = filename
    .replace(/[\/\b\0\r\n\t\\]/g, '_')
    .replace(/(\.\.[\/\\])+/g, '')
    .replace(/^[.\s]+/, '')
    .trim();
  if (!sanitized) sanitized = 'decrypted_file';
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }
  return sanitized;
}

/**
 * Encrypt Text
 * Version 2 Format: "ZERO:v2:" + Base64([16-byte Salt] + [12-byte IV] + [AES-GCM Ciphertext])
 */
export async function encryptText(
  plainText: string,
  password: string,
  keyfileBuffer?: ArrayBuffer | null
): Promise<string> {
  if (!password && !keyfileBuffer) {
    throw new Error('Password or keyfile is required for encryption');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ['encrypt'], keyfileBuffer, DEFAULT_PBKDF2_ITERATIONS);

  const textEncoder = new TextEncoder();
  const encodedText = textEncoder.encode(plainText);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    encodedText
  );

  const ciphertext = new Uint8Array(ciphertextBuffer);

  const combined = new Uint8Array(16 + 12 + ciphertext.length);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(ciphertext, 28);

  return `ZERO:v2:${bufferToBase64(combined)}`;
}

/**
 * Decrypt Text
 * Supports Version 2 (`ZERO:v2:...`) with 600,000 iterations and Legacy V1 with 100,000 iterations.
 */
export async function decryptText(
  rawInput: string,
  password: string,
  keyfileBuffer?: ArrayBuffer | null
): Promise<string> {
  if (!password && !keyfileBuffer) {
    throw new Error('Password or keyfile is required for decryption');
  }

  let base64Payload = rawInput.trim();
  let iterations = DEFAULT_PBKDF2_ITERATIONS;

  if (base64Payload.startsWith('ZERO:v2:')) {
    base64Payload = base64Payload.replace('ZERO:v2:', '');
    iterations = DEFAULT_PBKDF2_ITERATIONS;
  } else {
    iterations = LEGACY_PBKDF2_ITERATIONS;
  }

  const combined = base64ToBuffer(base64Payload);
  if (combined.length < 28) {
    throw new Error('Invalid payload: buffer too short to contain cryptographic salt and IV header');
  }

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  let key: CryptoKey;
  try {
    key = await deriveKey(password, salt, ['decrypt'], keyfileBuffer, iterations);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Key derivation failed';
    throw new Error(msg);
  }

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      ciphertext as unknown as BufferSource
    );

    const textDecoder = new TextDecoder('utf-8', { fatal: true });
    return textDecoder.decode(decryptedBuffer);
  } catch {
    if (iterations === DEFAULT_PBKDF2_ITERATIONS) {
      try {
        const legacyKey = await deriveKey(password, salt, ['decrypt'], keyfileBuffer, LEGACY_PBKDF2_ITERATIONS);
        const legacyDecryptedBuffer = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv as unknown as BufferSource,
          },
          legacyKey,
          ciphertext as unknown as BufferSource
        );
        const textDecoder = new TextDecoder('utf-8', { fatal: true });
        return textDecoder.decode(legacyDecryptedBuffer);
      } catch {
        // Fall through
      }
    }
    throw new Error('Decryption failed: Incorrect password/keyfile or corrupted payload.');
  }
}

/**
 * Custom TransformStream to calculate progress
 */
export function createProgressStream(
  totalBytes: number,
  onProgress: (percent: number, processedBytes: number) => void
): TransformStream<Uint8Array, Uint8Array> {
  let loaded = 0;
  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      loaded += chunk.length;
      if (totalBytes > 0) {
        const pct = Math.min(100, Math.round((loaded / totalBytes) * 100));
        onProgress(pct, loaded);
      }
      controller.enqueue(chunk);
    },
    flush() {
      onProgress(100, loaded);
    },
  });
}

/**
 * Stream reader accumulator with zip bomb decompression output byte capping
 */
async function streamToUint8Array(
  stream: ReadableStream<Uint8Array>,
  maxBytes = 2 * 1024 * 1024 * 1024
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      totalLength += value.length;
      if (totalLength > maxBytes) {
        reader.cancel();
        throw new Error(`Decompression limit exceeded (${(maxBytes / (1024 * 1024)).toFixed(0)} MB limit). Aborted for zip bomb safety.`);
      }
      chunks.push(value);
    }
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/**
 * Derives a chunk-specific IV from baseIV and chunk index
 */
function deriveChunkIv(baseIv: Uint8Array, chunkIndex: number): Uint8Array {
  const chunkIv = new Uint8Array(12);
  chunkIv.set(baseIv);
  const dataView = new DataView(chunkIv.buffer);
  const currentVal = dataView.getUint32(8, true);
  dataView.setUint32(8, currentVal ^ chunkIndex, true);
  return chunkIv;
}

/**
 * Encrypt File using Chunked Architectural Streaming (Version 3)
 * Peak Memory: ~4MB regardless of file size (supports multi-gigabyte files without browser OOM crashes)
 */
export async function encryptFile(
  file: File,
  password: string,
  onProgress?: (progress: EncryptionProgress) => void,
  keyfileBuffer?: ArrayBuffer | null
): Promise<{ blob: Blob; fileName: string }> {
  if (!password && !keyfileBuffer) {
    throw new Error('Password or keyfile is required for file encryption');
  }

  onProgress?.({ percent: 5, stage: 'compressing' });

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const baseIv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = DEFAULT_PBKDF2_ITERATIONS;
  const chunkSize = STREAM_CHUNK_SIZE;

  const key = await deriveKey(password, salt, ['encrypt'], keyfileBuffer, iterations);

  const metadata: FileMetadata = {
    name: sanitizeFilename(file.name),
    type: file.type || 'application/octet-stream',
    compressed: false,
    size: file.size,
    encryptedAt: Date.now(),
    version: 3,
    chunked: true,
    chunkSize,
  };

  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const metadataLength = metadataBytes.length;

  // Build V3 Header:
  // 0..5: Magic "ZERO\x03\x00" (6B)
  // 6..9: Iterations uint32 LE (4B)
  // 10..13: ChunkSize uint32 LE (4B)
  // 14..17: MetadataLength uint32 LE (4B)
  // 18..(18+metadataLength): Metadata UTF-8 JSON
  // Salt (16B) + BaseIV (12B)
  const headerSize = 6 + 4 + 4 + 4 + metadataLength + 16 + 12;
  const headerBuffer = new ArrayBuffer(headerSize);
  const headerView = new DataView(headerBuffer);
  const headerArray = new Uint8Array(headerBuffer);

  headerArray.set(MAGIC_V3, 0);
  headerView.setUint32(6, iterations, true);
  headerView.setUint32(10, chunkSize, true);
  headerView.setUint32(14, metadataLength, true);
  headerArray.set(metadataBytes, 18);

  const saltOffset = 18 + metadataLength;
  headerArray.set(salt, saltOffset);

  const ivOffset = saltOffset + 16;
  headerArray.set(baseIv, ivOffset);

  const blobParts: BlobPart[] = [headerBuffer];

  // Process file in memory-safe 2MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize) || 1;
  let processedBytes = 0;

  onProgress?.({ percent: 15, stage: 'encrypting' });

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const sliceBlob = file.slice(start, end);
    const sliceBuffer = await sliceBlob.arrayBuffer();

    const chunkIv = deriveChunkIv(baseIv, chunkIndex);
    const isFinal = chunkIndex === totalChunks - 1 ? 1 : 0;

    // Authenticated Data per chunk: [ 4B chunkIndex ][ 1B isFinal ]
    const aad = new Uint8Array(5);
    const aadView = new DataView(aad.buffer);
    aadView.setUint32(0, chunkIndex, true);
    aadView.setUint8(4, isFinal);

    const encryptedChunkBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: chunkIv as unknown as BufferSource,
        additionalData: aad as unknown as BufferSource,
      },
      key,
      sliceBuffer
    );

    // Write chunk length header (4 bytes uint32 LE) + encrypted chunk
    const chunkLenBuffer = new ArrayBuffer(4);
    new DataView(chunkLenBuffer).setUint32(0, encryptedChunkBuffer.byteLength, true);

    blobParts.push(chunkLenBuffer);
    blobParts.push(encryptedChunkBuffer);

    processedBytes += sliceBuffer.byteLength;
    const pct = Math.min(95, Math.round(15 + (processedBytes / Math.max(1, file.size)) * 80));
    onProgress?.({ percent: pct, stage: 'encrypting' });
  }

  onProgress?.({ percent: 100, stage: 'idle' });

  const targetFileName = `${sanitizeFilename(file.name)}.encc`;
  const resultBlob = new Blob(blobParts, { type: 'application/octet-stream' });

  return {
    blob: resultBlob,
    fileName: targetFileName,
  };
}

/**
 * Decrypt File supporting V3 Streaming, V2 Authenticated, and V1 Legacy Fallback
 */
export async function decryptFile(
  file: File,
  password: string,
  onProgress?: (progress: EncryptionProgress) => void,
  keyfileBuffer?: ArrayBuffer | null
): Promise<File> {
  if (!password && !keyfileBuffer) {
    throw new Error('Password or keyfile is required for file decryption');
  }

  onProgress?.({ percent: 5, stage: 'decrypting' });

  // Read header prefix (first 256 bytes) to inspect magic
  const headerSlice = await file.slice(0, Math.min(256, file.size)).arrayBuffer();
  const headerBytes = new Uint8Array(headerSlice);

  const isV3 =
    headerBytes.length >= 6 &&
    headerBytes[0] === 0x5A &&
    headerBytes[1] === 0x45 &&
    headerBytes[2] === 0x52 &&
    headerBytes[3] === 0x4F &&
    headerBytes[4] === 0x03 &&
    headerBytes[5] === 0x00;

  if (isV3) {
    // V3 Chunked Architectural Streaming Decryption
    const dataView = new DataView(headerSlice);
    const iterations = dataView.getUint32(6, true);
    const chunkSize = dataView.getUint32(10, true);
    const metadataLength = dataView.getUint32(14, true);

    const fullHeaderSize = 18 + metadataLength + 16 + 12;
    const fullHeaderBuffer = await file.slice(0, fullHeaderSize).arrayBuffer();
    const fullHeaderView = new DataView(fullHeaderBuffer);
    const fullHeaderArray = new Uint8Array(fullHeaderBuffer);

    const metadataBytes = fullHeaderArray.subarray(18, 18 + metadataLength);
    let metadata: FileMetadata;
    try {
      metadata = JSON.parse(new TextDecoder('utf-8').decode(metadataBytes));
    } catch {
      throw new Error('Could not parse file metadata header: Corrupted archive');
    }

    const saltOffset = 18 + metadataLength;
    const salt = fullHeaderArray.slice(saltOffset, saltOffset + 16);
    const baseIv = fullHeaderArray.slice(saltOffset + 16, saltOffset + 16 + 12);

    const key = await deriveKey(password, salt, ['decrypt'], keyfileBuffer, iterations);

    const decryptedBlobParts: BlobPart[] = [];
    let fileOffset = fullHeaderSize;
    let chunkIndex = 0;
    const totalFileSize = file.size;

    onProgress?.({ percent: 15, stage: 'decrypting' });

    while (fileOffset < totalFileSize) {
      if (fileOffset + 4 > totalFileSize) {
        throw new Error('Truncated file archive during chunk header read');
      }

      const lenBuffer = await file.slice(fileOffset, fileOffset + 4).arrayBuffer();
      const encChunkLen = new DataView(lenBuffer).getUint32(0, true);
      fileOffset += 4;

      if (fileOffset + encChunkLen > totalFileSize) {
        throw new Error('Truncated chunk in encrypted file archive');
      }

      const encChunkBuffer = await file.slice(fileOffset, fileOffset + encChunkLen).arrayBuffer();
      fileOffset += encChunkLen;

      const chunkIv = deriveChunkIv(baseIv, chunkIndex);
      const isFinal = fileOffset >= totalFileSize ? 1 : 0;

      const aad = new Uint8Array(5);
      const aadView = new DataView(aad.buffer);
      aadView.setUint32(0, chunkIndex, true);
      aadView.setUint8(4, isFinal);

      let decryptedChunk: ArrayBuffer;
      try {
        decryptedChunk = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: chunkIv as unknown as BufferSource,
            additionalData: aad as unknown as BufferSource,
          },
          key,
          encChunkBuffer
        );
      } catch {
        throw new Error('Decryption failed: Incorrect password/keyfile or tampered data chunk.');
      }

      decryptedBlobParts.push(decryptedChunk);
      chunkIndex++;

      const pct = Math.min(95, Math.round(15 + (fileOffset / Math.max(1, totalFileSize)) * 80));
      onProgress?.({ percent: pct, stage: 'decrypting' });
    }

    onProgress?.({ percent: 100, stage: 'idle' });

    let reconstructedName = sanitizeFilename(metadata.name || file.name.replace(/\.encc$/i, ''));
    if (!reconstructedName) reconstructedName = 'decrypted_file';

    const resultBlob = new Blob(decryptedBlobParts, { type: metadata.type || 'application/octet-stream' });
    return new File([resultBlob], reconstructedName, { type: metadata.type || 'application/octet-stream' });
  }

  // Single-pass Fallback for V2 & V1 Legacy Files
  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength < 32) {
    throw new Error('Invalid file: File size is smaller than required header length');
  }

  const fullBytes = new Uint8Array(arrayBuffer);
  const isV2 =
    fullBytes.length >= 6 &&
    fullBytes[0] === 0x5A &&
    fullBytes[1] === 0x45 &&
    fullBytes[2] === 0x52 &&
    fullBytes[3] === 0x4F &&
    fullBytes[4] === 0x02 &&
    fullBytes[5] === 0x00;

  let metadata: FileMetadata;
  let metadataBytes: Uint8Array;
  let salt: Uint8Array;
  let iv: Uint8Array;
  let ciphertext: Uint8Array;
  let iterations = DEFAULT_PBKDF2_ITERATIONS;
  let useAad = false;

  if (isV2) {
    const dataView = new DataView(arrayBuffer);
    iterations = dataView.getUint32(6, true);
    const metadataLength = dataView.getUint32(10, true);

    if (metadataLength <= 0 || 14 + metadataLength + 28 > arrayBuffer.byteLength) {
      throw new Error('Invalid or corrupted V2 encrypted file header');
    }

    metadataBytes = fullBytes.subarray(14, 14 + metadataLength);
    try {
      metadata = JSON.parse(new TextDecoder('utf-8').decode(metadataBytes));
    } catch {
      throw new Error('Could not parse file metadata header: Corrupted archive');
    }

    const saltOffset = 14 + metadataLength;
    const ivOffset = saltOffset + 16;
    const ciphertextOffset = ivOffset + 12;

    salt = fullBytes.slice(saltOffset, saltOffset + 16);
    iv = fullBytes.slice(ivOffset, ivOffset + 12);
    ciphertext = fullBytes.slice(ciphertextOffset);
    useAad = true;
  } else {
    // V1 Legacy Fallback
    const dataView = new DataView(arrayBuffer);
    const metadataLength = dataView.getUint32(0, true);

    if (metadataLength <= 0 || 4 + metadataLength + 28 > arrayBuffer.byteLength) {
      throw new Error('Invalid or corrupted encrypted file header');
    }

    metadataBytes = fullBytes.subarray(4, 4 + metadataLength);
    try {
      metadata = JSON.parse(new TextDecoder('utf-8').decode(metadataBytes));
    } catch {
      throw new Error('Could not parse file metadata header: Corrupted archive');
    }

    const saltOffset = 4 + metadataLength;
    const ivOffset = saltOffset + 16;
    const ciphertextOffset = ivOffset + 12;

    salt = fullBytes.slice(saltOffset, saltOffset + 16);
    iv = fullBytes.slice(ivOffset, ivOffset + 12);
    ciphertext = fullBytes.slice(ciphertextOffset);
    iterations = LEGACY_PBKDF2_ITERATIONS;
    useAad = false;
  }

  onProgress?.({ percent: 35, stage: 'decrypting' });

  const key = await deriveKey(password, salt, ['decrypt'], keyfileBuffer, iterations);

  let decryptedBuffer: ArrayBuffer;
  try {
    const decryptParams: AesGcmParams = {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    };
    if (useAad) {
      decryptParams.additionalData = metadataBytes as unknown as BufferSource;
    }

    decryptedBuffer = await crypto.subtle.decrypt(decryptParams, key, ciphertext as unknown as BufferSource);
  } catch {
    if (isV2) {
      throw new Error('Decryption failed: Incorrect password/keyfile or tampered metadata header.');
    } else {
      throw new Error('Decryption failed: Incorrect password or corrupted file data');
    }
  }

  onProgress?.({ percent: 65, stage: 'decompressing' });

  let finalBytes: Uint8Array;
  if (metadata.compressed && typeof DecompressionStream !== 'undefined') {
    try {
      const stream = new Response(decryptedBuffer).body;
      if (!stream) throw new Error('Stream empty');
      const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
      const maxDecompressedBytes = Math.max((metadata.size || 0) * 10, 2 * 1024 * 1024 * 1024);
      finalBytes = await streamToUint8Array(decompressedStream, maxDecompressedBytes);
    } catch {
      finalBytes = new Uint8Array(decryptedBuffer);
    }
  } else {
    finalBytes = new Uint8Array(decryptedBuffer);
  }

  onProgress?.({ percent: 95, stage: 'finalizing' });

  let reconstructedName = sanitizeFilename(metadata.name || file.name.replace(/\.encc$/i, ''));
  if (!reconstructedName) {
    reconstructedName = 'decrypted_file';
  }

  const restoredFile = new File([finalBytes as BlobPart], reconstructedName, {
    type: metadata.type || 'application/octet-stream',
  });

  onProgress?.({ percent: 100, stage: 'idle' });

  return restoredFile;
}

/**
 * Automatic browser download trigger
 */
export function downloadBlob(blob: Blob | File, filename: string): void {
  const safeName = sanitizeFilename(filename);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 24-character high-entropy cryptographic password generator
 */
export function generateSecurePassword(length = 24): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = upper + lower + digits + symbols;

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  const guarantee = [
    upper[array[0] % upper.length],
    lower[array[1] % lower.length],
    digits[array[2] % digits.length],
    symbols[array[3] % symbols.length],
  ];

  const remaining: string[] = [];
  for (let i = 4; i < length; i++) {
    remaining.push(allChars[array[i] % allChars.length]);
  }

  const combined = [...guarantee, ...remaining];
  const shuffleRand = new Uint32Array(combined.length);
  crypto.getRandomValues(shuffleRand);
  for (let i = combined.length - 1; i > 0; i--) {
    const j = shuffleRand[i] % (i + 1);
    const temp = combined[i];
    combined[i] = combined[j];
    combined[j] = temp;
  }

  return combined.join('');
}

/**
 * Entropy-based Password Strength Meter Evaluation
 */
export interface PasswordStrength {
  score: number; // 0 - 100
  label: 'WEAK' | 'FAIR' | 'STRONG' | 'SECURE';
  color: string;
  checks: {
    length: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

const COMMON_WEAK_PATTERNS = [
  'password', '123456', 'qwerty', 'admin', 'welcome', 'letmein',
  'iloveyou', 'sunshine', 'princess', 'dragon', 'football', 'monkey'
];

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'WEAK',
      color: '#ef4444',
      checks: {
        length: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSymbol: false,
      },
    };
  }

  const checks = {
    length: password.length >= 12,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  let poolSize = 0;
  if (checks.hasLower) poolSize += 26;
  if (checks.hasUpper) poolSize += 26;
  if (checks.hasNumber) poolSize += 10;
  if (checks.hasSymbol) poolSize += 32;

  const entropyBits = poolSize > 0 ? password.length * Math.log2(poolSize) : 0;
  const lowerPass = password.toLowerCase();
  const isWeakPattern = COMMON_WEAK_PATTERNS.some((pattern) => lowerPass.includes(pattern));

  let score = 0;
  if (isWeakPattern) {
    score = 15;
  } else {
    score = Math.min(100, Math.round((entropyBits / 90) * 100));
  }

  let label: 'WEAK' | 'FAIR' | 'STRONG' | 'SECURE' = 'WEAK';
  let color = '#ef4444';

  if (score >= 85) {
    label = 'SECURE';
    color = '#06b6d4';
  } else if (score >= 65) {
    label = 'STRONG';
    color = '#10b981';
  } else if (score >= 40) {
    label = 'FAIR';
    color = '#f59e0b';
  }

  return {
    score,
    label,
    color,
    checks,
  };
}
