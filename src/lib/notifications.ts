/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

interface NativeFileManagerPlugin {
  openDownloads(): Promise<void>;
}

// Native Android plugin registered in MainActivity.java to fire android.intent.action.VIEW_DOWNLOADS
const NativeFileManager = registerPlugin<NativeFileManagerPlugin>('NativeFileManager');

let hasRequestedPermission = false;
let isChannelCreated = false;
let isListenerRegistered = false;

const NOTIFICATION_CHANNEL_ID = 'zero_operations';

/**
 * Initializes notification listeners and channels.
 * Called once on app startup or first user interaction.
 */
export async function initNotifications(onNotificationTap?: (info: { actionId?: string }) => void): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      // Create Android Notification Channel
      if (!isChannelCreated) {
        await LocalNotifications.createChannel({
          id: NOTIFICATION_CHANNEL_ID,
          name: 'Cryptographic Operations',
          description: 'Notifies when Zero file encryption or decryption completes or fails.',
          importance: 4, // High importance (banners & sounds)
          visibility: 1, // Public on lockscreen (safe since no sensitive info is included)
          vibration: true,
        });
        isChannelCreated = true;
      }

      // Listen for notification tap action
      if (!isListenerRegistered) {
        await LocalNotifications.addListener('localNotificationActionPerformed', async (notificationAction) => {
          onNotificationTap?.({ actionId: notificationAction.actionId });

          // Tap behavior requirement:
          // Tapping notification opens phone's Downloads view (android.intent.action.VIEW_DOWNLOADS)
          try {
            await NativeFileManager.openDownloads();
          } catch (intentErr) {
            console.warn('NativeFileManager.openDownloads error:', intentErr);
          }
        });
        isListenerRegistered = true;
      }
    } catch (err) {
      console.warn('Failed to initialize native notifications:', err);
    }
  } else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Web / PWA listener for messages forwarded from sw-notifications.js
    if (!isListenerRegistered) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'ZERO_NOTIFICATION_CLICK') {
          onNotificationTap?.({ actionId: event.data.action });
        }
      });
      isListenerRegistered = true;
    }
  }
}

/**
 * Requests notification permissions ONLY upon a user action (e.g. first encrypt/decrypt click).
 * Never prompted on initial page load. Handled safely if denied without throwing.
 */
export async function requestNotificationPermissionOnUserAction(): Promise<boolean> {
  if (hasRequestedPermission) {
    return checkNotificationPermission();
  }
  hasRequestedPermission = true;

  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') {
        return true;
      }
      if (status.display === 'denied') {
        return false;
      }
      const req = await LocalNotifications.requestPermissions();
      return req.display === 'granted';
    } catch (err) {
      console.warn('Native notification permission request failed:', err);
      return false;
    }
  } else if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        return true;
      }
      if (Notification.permission === 'denied') {
        return false;
      }
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch (err) {
      console.warn('Web notification permission request failed:', err);
      return false;
    }
  }

  return false;
}

/**
 * Checks current notification permission state without prompting.
 */
export async function checkNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      return status.display === 'granted';
    } catch {
      return false;
    }
  } else if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission === 'granted';
  }
  return false;
}

export interface NotifyOperationParams {
  type: 'encrypt' | 'decrypt';
  filename: string;
  success: boolean;
}

/**
 * Dispatches a completion notification.
 * SECURITY GUARANTEE:
 * Never includes keys, passwords, keyfile contents, or file contents in any notification.
 */
export async function notifyOperationComplete({
  type,
  filename,
  success,
}: NotifyOperationParams): Promise<void> {
  const isGranted = await checkNotificationPermission();
  if (!isGranted) {
    return;
  }

  let title = '';
  let body = '';

  if (success) {
    if (type === 'encrypt') {
      title = `Encryption complete: ${filename}`;
      body = 'Ciphertext created and saved to your device. Tap to open Downloads.';
    } else {
      title = `Decryption complete: ${filename}`;
      body = 'Original file restored and saved to your device. Tap to open Downloads.';
    }
  } else {
    // Generic message only for failures to protect zero-knowledge integrity
    title = 'Zero: Operation failed';
    body = 'Could not process the requested file. Please verify credentials and try again.';
  }

  // 1. Native Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      const id = Math.floor(Math.random() * 1000000) + 1;
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            channelId: NOTIFICATION_CHANNEL_ID,
            smallIcon: 'ic_stat_icon_config_sample',
            extra: {
              type,
              success,
              filename: success ? filename : undefined,
            },
          },
        ],
      });
    } catch (err) {
      console.warn('Native LocalNotifications.schedule failed:', err);
    }
    return;
  }

  // 2. Web / PWA via Service Worker (not new Notification(), so it works on mobile devices)
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: `zero-${Date.now()}`,
          data: {
            type,
            success,
            filename: success ? filename : undefined,
          },
        });
      }
    } catch (swErr) {
      console.warn('Service worker showNotification failed:', swErr);
    }
  }
}
