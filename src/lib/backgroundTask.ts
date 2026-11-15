/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import type { AppMode } from '../types';
import { NativeFileManager } from './nativeFileManager';

let activeBackgroundTasks = 0;

/**
 * Starts the Android Foreground Service before long file encryption/decryption or
 * storage writes so Android does not freeze execution when the app is minimized.
 * Uses a reference count so nested calls (batch + save) stay active until all finish.
 */
export async function startBackgroundProcessing(mode: AppMode): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  activeBackgroundTasks++;
  if (activeBackgroundTasks > 1) {
    return;
  }
  try {
    await NativeFileManager.startBackgroundTask({ mode });
  } catch (err) {
    console.warn('Unable to start background foreground service:', err);
  }
}

/**
 * Decrements the active background task count and stops the Android Foreground
 * Service + WakeLock once all active operations and storage writes finish.
 */
export async function stopBackgroundProcessing(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  activeBackgroundTasks = Math.max(0, activeBackgroundTasks - 1);
  if (activeBackgroundTasks > 0) {
    return;
  }
  try {
    await NativeFileManager.stopBackgroundTask();
  } catch (err) {
    console.warn('Unable to stop background foreground service:', err);
  }
}
