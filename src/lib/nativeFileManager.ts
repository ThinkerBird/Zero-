/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerPlugin } from '@capacitor/core';
import type { AppMode } from '../types';

export interface NativeFileManagerPlugin {
  openDownloads(): Promise<void>;
  beginSaveFile(options: { filename: string; mimeType?: string }): Promise<{ streamId: string; filename: string }>;
  writeSaveChunk(options: { streamId: string; data: string }): Promise<void>;
  finishSaveFile(options: { streamId: string }): Promise<{ uri: string; filename: string }>;
  abortSaveFile(options: { streamId: string }): Promise<void>;
  startBackgroundTask(options: { mode: AppMode }): Promise<void>;
  stopBackgroundTask(): Promise<void>;
}

export const NativeFileManager = registerPlugin<NativeFileManagerPlugin>('NativeFileManager');
