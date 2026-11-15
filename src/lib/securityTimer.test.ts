import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTO_CLEAR_TIMEOUT_SECONDS,
  evaluateInactivityTick,
  shouldAllowEmergencyWipe,
} from './securityTimer';

test('shouldAllowEmergencyWipe blocks wipe while processing and allows it when idle', () => {
  assert.equal(shouldAllowEmergencyWipe(true), false);
  assert.equal(shouldAllowEmergencyWipe(false), true);
});

test('evaluateInactivityTick does not wipe or count down while processing exceeds 60s (e.g. minimized)', () => {
  const startMs = 1_000_000;
  // Simulate 5 minutes passing while encryption/decryption is active in background
  const result = evaluateInactivityTick({
    autoClearEnabled: true,
    isProcessing: true,
    nowMs: startMs + 300_000,
    lastActivityMs: startMs,
    hasSensitiveData: true,
  });

  assert.equal(result.shouldAutoClear, false);
  assert.equal(result.remainingSeconds, AUTO_CLEAR_TIMEOUT_SECONDS);
  assert.equal(result.nextLastActivityMs, startMs + 300_000);
});

test('evaluateInactivityTick starts a fresh 60s window after processing completes', () => {
  const finishMs = 1_300_000;
  // One second after processing finishes, countdown is 59s and does not wipe
  const afterOneSecond = evaluateInactivityTick({
    autoClearEnabled: true,
    isProcessing: false,
    nowMs: finishMs + 1_000,
    lastActivityMs: finishMs,
    hasSensitiveData: true,
  });
  assert.equal(afterOneSecond.shouldAutoClear, false);
  assert.equal(afterOneSecond.remainingSeconds, 59);

  // At 60s of idle after completion, auto-clear activates when sensitive data exists
  const afterSixtySeconds = evaluateInactivityTick({
    autoClearEnabled: true,
    isProcessing: false,
    nowMs: finishMs + 60_000,
    lastActivityMs: finishMs,
    hasSensitiveData: true,
  });
  assert.equal(afterSixtySeconds.shouldAutoClear, true);
  assert.equal(afterSixtySeconds.remainingSeconds, AUTO_CLEAR_TIMEOUT_SECONDS);
});

test('evaluateInactivityTick does not auto-clear when disabled or when no sensitive data exists', () => {
  const startMs = 1_000_000;
  const disabledResult = evaluateInactivityTick({
    autoClearEnabled: false,
    isProcessing: false,
    nowMs: startMs + 120_000,
    lastActivityMs: startMs,
    hasSensitiveData: true,
  });
  assert.equal(disabledResult.shouldAutoClear, false);

  const emptyResult = evaluateInactivityTick({
    autoClearEnabled: true,
    isProcessing: false,
    nowMs: startMs + 120_000,
    lastActivityMs: startMs,
    hasSensitiveData: false,
  });
  assert.equal(emptyResult.shouldAutoClear, false);
  assert.equal(emptyResult.remainingSeconds, 0);
});
