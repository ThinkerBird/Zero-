/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { NativeFileManager } from './nativeFileManager';

export interface FileSaveResult {
  success: boolean;
  method: 'native' | 'download' | 'share';
  filename: string;
  pathOrUri?: string;
  error?: string;
}

// 768 KB binary chunk (multiple of 3 -> clean 1 MB base64 string per Capacitor bridge call)
export const NATIVE_SAVE_CHUNK_SIZE = 768 * 1024;

/**
 * Sanitizes filename to prevent path traversal or invalid characters.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'decrypted_file';
  // Strip null bytes and directory traversal characters
  const clean = filename.replace(/\0/g, '').replace(/[/\\?%*:|"<>]/g, '_').trim();
  return clean || 'file';
}

/**
 * Encodes a single small ArrayBuffer chunk to base64 without call stack overflow.
 */
export function chunkBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) return '';
  const subChunkSize = 0x8000; // 32 KB
  let binary = '';
  for (let i = 0; i < bytes.length; i += subChunkSize) {
    const slice = bytes.subarray(i, Math.min(i + subChunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, slice as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Streams a Blob in fixed-size base64 chunks so peak memory stays ~2 MB regardless of total file size.
 */
export async function streamBlobInBase64Chunks(
  blob: Blob,
  chunkSize: number,
  onChunk: (base64Chunk: string, chunkIndex: number) => Promise<void>
): Promise<void> {
  if (blob.size === 0) {
    await onChunk('', 0);
    return;
  }

  let offset = 0;
  let chunkIndex = 0;
  while (offset < blob.size) {
    const end = Math.min(blob.size, offset + chunkSize);
    const chunkBuffer = await blob.slice(offset, end).arrayBuffer();
    const base64Chunk = chunkBufferToBase64(chunkBuffer);
    await onChunk(base64Chunk, chunkIndex);
    offset = end;
    chunkIndex++;
  }
}

async function saveViaNativeStream(blob: Blob, filename: string): Promise<{ uri: string; filename: string }> {
  const { streamId, filename: savedName } = await NativeFileManager.beginSaveFile({
    filename,
    mimeType: blob.type || 'application/octet-stream',
  });

  try {
    await streamBlobInBase64Chunks(blob, NATIVE_SAVE_CHUNK_SIZE, async (base64Chunk) => {
      if (base64Chunk.length > 0) {
        await NativeFileManager.writeSaveChunk({ streamId, data: base64Chunk });
      }
    });
    const finishRes = await NativeFileManager.finishSaveFile({ streamId });
    return {
      uri: finishRes.uri,
      filename: finishRes.filename || savedName || filename,
    };
  } catch (err) {
    await NativeFileManager.abortSaveFile({ streamId }).catch(() => {});
    throw err;
  }
}

async function saveViaChunkedFilesystem(blob: Blob, filename: string, directory: Directory): Promise<string> {
  await streamBlobInBase64Chunks(blob, NATIVE_SAVE_CHUNK_SIZE, async (base64Chunk, chunkIndex) => {
    if (chunkIndex === 0) {
      await Filesystem.writeFile({
        path: filename,
        data: base64Chunk,
        directory,
        recursive: true,
      });
    } else if (base64Chunk.length > 0) {
      await Filesystem.appendFile({
        path: filename,
        data: base64Chunk,
        directory,
      });
    }
  });

  const uriRes = await Filesystem.getUri({ path: filename, directory });
  return uriRes.uri;
}

// Keep track of active object URLs so we don't revoke them before the browser finishes writing
const activeObjectUrls = new Set<string>();

/**
 * Direct synchronous browser download trigger.
 * Executed synchronously inside user click gesture for maximum browser compatibility.
 */
export function triggerBrowserDownload(blob: Blob | File, rawFilename: string): boolean {
  try {
    const filename = sanitizeFilename(rawFilename);
    const safeBlob = blob;
    const url = URL.createObjectURL(safeBlob);
    activeObjectUrls.add(url);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';

    document.body.appendChild(link);
    if (typeof link.click === 'function') {
      link.click();
    } else {
      const evt = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
      link.dispatchEvent(evt);
    }
    document.body.removeChild(link);

    // Retain object URL for 60 seconds so browser download manager finishes streaming
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
        activeObjectUrls.delete(url);
      } catch {
        // Ignore revocation errors
      }
    }, 60000);

    return true;
  } catch (err) {
    console.error('triggerBrowserDownload error:', err);
    return false;
  }
}

/**
 * Single shared file saving utility for both encryption output and decrypted restored files.
 * Works uniformly across:
 * - Native Android/Capacitor: Streams in 768 KB chunks via NativeFileManager (MediaStore/Documents)
 *   or chunked @capacitor/filesystem so large files never cause WebView/Java OOM crashes.
 * - Desktop Chrome/Firefox/Safari: Triggers download via <a download> without early URL revocation.
 * - Mobile Android Chrome / iOS Safari: Synchronous download + Web Share API fallback.
 */
export async function saveFile(blob: Blob | File, rawFilename: string): Promise<FileSaveResult> {
  const filename = sanitizeFilename(rawFilename);

  // 1. Native Capacitor Environment
  if (Capacitor.isNativePlatform()) {
    try {
      const nativeResult = await saveViaNativeStream(blob, filename);
      return {
        success: true,
        method: 'native',
        filename: nativeResult.filename,
        pathOrUri: nativeResult.uri,
      };
    } catch (streamErr: unknown) {
      console.warn('NativeFileManager streaming failed, falling back to chunked Filesystem:', streamErr);
    }

    try {
      const permStatus = await Filesystem.checkPermissions();
      if (permStatus.publicStorage !== 'granted') {
        const reqResult = await Filesystem.requestPermissions();
        if (reqResult.publicStorage !== 'granted') {
          console.warn('Public storage permission denied, falling back to app Data directory.');
        }
      }

      try {
        const uri = await saveViaChunkedFilesystem(blob, filename, Directory.Documents);
        return {
          success: true,
          method: 'native',
          filename,
          pathOrUri: uri,
        };
      } catch (docsErr) {
        console.warn('Documents chunked save failed, trying app Data directory:', docsErr);
        const uri = await saveViaChunkedFilesystem(blob, filename, Directory.Data);
        return {
          success: true,
          method: 'native',
          filename,
          pathOrUri: uri,
        };
      }
    } catch (nativeErr: unknown) {
      const errMsg = nativeErr instanceof Error ? nativeErr.message : 'Native file save failed';
      console.error('All native save paths failed:', errMsg);
      return {
        success: false,
        method: 'native',
        filename,
        error: errMsg,
      };
    }
  }

  // 2. Web / PWA Environment
  try {
    const webSuccess = triggerBrowserDownload(blob, filename);
    if (webSuccess) {
      return {
        success: true,
        method: 'download',
        filename,
      };
    }
  } catch {
    // Fall through to share API
  }

  // 3. Fallback to Web Share API if download attribute is unsupported or throws
  if (typeof navigator !== 'undefined' && 'canShare' in navigator) {
    try {
      const shareFile = new File([blob], filename, {
        type: blob.type || 'application/octet-stream',
      });
      if (navigator.canShare({ files: [shareFile] })) {
        await navigator.share({
          files: [shareFile],
          title: filename,
        });
        return {
          success: true,
          method: 'share',
          filename,
        };
      }
    } catch (shareErr) {
      // If user cancelled share sheet, don't treat as fatal if they aborted
      if ((shareErr as Error)?.name === 'AbortError') {
        return {
          success: true,
          method: 'share',
          filename,
        };
      }
    }
  }

  return {
    success: false,
    method: 'download',
    filename,
    error: 'Download failed',
  };
}
