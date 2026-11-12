/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';

export interface PasteResult {
  text: string | null;
  success: boolean;
  needsManualHint: boolean;
  errorMessage?: string;
}

/**
 * Reads text from the clipboard reliably across Native Android (Capacitor) and Web/PWA.
 * On Native: Uses @capacitor/clipboard plugin which does not require WebView permissions.
 * On Web: Uses navigator.clipboard.readText() with permission checks.
 */
export async function readClipboardText(): Promise<string | null> {
  // 1. Native Capacitor App
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await Clipboard.read();
      if (res && typeof res.value === 'string') {
        return res.value;
      }
      return null;
    } catch (nativeErr) {
      console.warn('Native clipboard read error:', nativeErr);
      // Fall through to browser attempt or error
    }
  }

  // 2. Web / PWA Browser
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
    // Optionally check permissions if available
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const perm = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
          if (perm.state === 'denied') {
            throw new Error('Clipboard permission denied by browser.');
          }
        } catch {
          // Some browsers throw when querying clipboard-read; continue to readText()
        }
      }

      const text = await navigator.clipboard.readText();
      return text ?? null;
    } catch (webErr) {
      console.warn('Web clipboard.readText failed:', webErr);
      throw webErr;
    }
  }

  throw new Error('Clipboard API is unavailable in this environment.');
}

/**
 * Handles paste action with automatic focus and graceful hint fallback.
 * If reading clipboard succeeds, calls onPasted.
 * If blocked (e.g., WebView restrictions, missing permission), focuses target input and calls onHintNeeded.
 */
export async function handleSafePaste({
  targetElement,
  onPasted,
  onHintNeeded,
  onError,
}: {
  targetElement?: HTMLInputElement | HTMLTextAreaElement | null;
  onPasted: (text: string) => void;
  onHintNeeded?: (hint: string) => void;
  onError?: (errMessage: string) => void;
}): Promise<void> {
  try {
    const text = await readClipboardText();
    if (text !== null && text.length > 0) {
      onPasted(text);
    } else {
      // Empty clipboard or no text
      onHintNeeded?.('Clipboard is empty or does not contain plain text.');
    }
  } catch (err: unknown) {
    // Focus target element so the user can easily paste via system popup
    if (targetElement) {
      try {
        targetElement.focus();
        targetElement.select();
      } catch {
        // Ignore focus errors
      }
    }

    const fallbackHint = 'Clipboard access restricted. Long-press the field and tap Paste.';
    if (onHintNeeded) {
      onHintNeeded(fallbackHint);
    } else if (onError) {
      onError(fallbackHint);
    }
  }
}
