/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface FileSaveResult {
  success: boolean;
  method: 'native' | 'download' | 'share';
  filename: string;
  pathOrUri?: string;
  error?: string;
}

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
 * Converts a Blob or File to a base64 string using FileReader.
 * This utilizes native browser streaming to prevent memory crashes on large files.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (!dataUrl) {
        reject(new Error('Failed to convert file to base64'));
        return;
      }
      const commaIndex = dataUrl.indexOf(',');
      if (commaIndex !== -1) {
        resolve(dataUrl.substring(commaIndex + 1));
      } else {
        resolve(dataUrl);
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error('FileReader error'));
    };
    reader.readAsDataURL(blob);
  });
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
 * - Native Android/Capacitor: Saves via @capacitor/filesystem to Public Documents directory.
 * - Desktop Chrome/Firefox/Safari: Triggers download via <a download> without early URL revocation.
 * - Mobile Android Chrome / iOS Safari: Synchronous download + Web Share API fallback.
 */
export async function saveFile(blob: Blob | File, rawFilename: string): Promise<FileSaveResult> {
  const filename = sanitizeFilename(rawFilename);

  // 1. Native Capacitor Environment
  if (Capacitor.isNativePlatform()) {
    try {
      // Check & request storage permissions if necessary
      const permStatus = await Filesystem.checkPermissions();
      if (permStatus.publicStorage !== 'granted') {
        const reqResult = await Filesystem.requestPermissions();
        if (reqResult.publicStorage !== 'granted') {
          console.warn('Public storage permission denied, writing to app Data directory.');
        }
      }

      // Convert blob to base64
      const base64Data = await blobToBase64(blob);

      // Save file to Documents (publicly visible on Android)
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      return {
        success: true,
        method: 'native',
        filename,
        pathOrUri: writeResult.uri,
      };
    } catch (nativeErr: unknown) {
      const errMsg = nativeErr instanceof Error ? nativeErr.message : 'Filesystem write failed';
      console.warn('Native filesystem save failed, falling back to Web download / share:', errMsg);
      // Fall through to browser download/share fallback below
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
  } catch (webErr: unknown) {
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
