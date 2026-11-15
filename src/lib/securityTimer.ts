/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const AUTO_CLEAR_TIMEOUT_SECONDS = 60;

export interface InactivityEvaluationInput {
  autoClearEnabled: boolean;
  isProcessing: boolean;
  nowMs: number;
  lastActivityMs: number;
  hasSensitiveData: boolean;
  timeoutSeconds?: number;
}

export interface InactivityEvaluationResult {
  remainingSeconds: number;
  shouldAutoClear: boolean;
  nextLastActivityMs: number;
}

/**
 * Manual or shortcut-triggered emergency wipe must NEVER activate while
 * encryption, decryption, or storage saving is actively running.
 */
export function shouldAllowEmergencyWipe(isProcessing: boolean): boolean {
  return !isProcessing;
}

/**
 * Evaluates the auto-clear inactivity countdown.
 * While `isProcessing` is true (including while the app is minimized during
 * encryption/decryption or storage saving), the timer pauses at full timeout
 * and refreshes `lastActivityMs` so auto-clear never interrupts or fires
 * immediately upon completion.
 */
export function evaluateInactivityTick({
  autoClearEnabled,
  isProcessing,
  nowMs,
  lastActivityMs,
  hasSensitiveData,
  timeoutSeconds = AUTO_CLEAR_TIMEOUT_SECONDS,
}: InactivityEvaluationInput): InactivityEvaluationResult {
  if (isProcessing) {
    return {
      remainingSeconds: timeoutSeconds,
      shouldAutoClear: false,
      nextLastActivityMs: nowMs,
    };
  }

  if (!autoClearEnabled) {
    return {
      remainingSeconds: timeoutSeconds,
      shouldAutoClear: false,
      nextLastActivityMs: lastActivityMs,
    };
  }

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - lastActivityMs) / 1000));
  const remainingSeconds = Math.max(0, timeoutSeconds - elapsedSeconds);

  if (remainingSeconds === 0 && hasSensitiveData) {
    return {
      remainingSeconds: timeoutSeconds,
      shouldAutoClear: true,
      nextLastActivityMs: nowMs,
    };
  }

  return {
    remainingSeconds,
    shouldAutoClear: false,
    nextLastActivityMs: lastActivityMs,
  };
}
