import { useEffect, useRef, useCallback } from 'react';

interface UseInactivityTimerOptions {
  /** ms of silence before onWarn fires (default: 2 min) */
  warnAfterMs?: number;
  /** ms of silence before onAutoSubmit fires (default: 5 min) */
  autoSubmitAfterMs?: number;
  /** called once when the warn threshold is crossed */
  onWarn: () => void;
  /** called once when the auto-submit threshold is crossed */
  onAutoSubmit: () => void;
  /** set to false to pause the timers (e.g. while already submitting) */
  enabled?: boolean;
}

/**
 * Detects user inactivity.
 *
 * Returns a stable `resetTimer` function.  Call it inside every
 * touch / scroll / interaction handler on your screen so the timers
 * restart from zero each time the user does something.
 *
 * Example
 * -------
 *   const { resetTimer } = useInactivityTimer({
 *     warnAfterMs:       2 * 60 * 1000,
 *     autoSubmitAfterMs: 5 * 60 * 1000,
 *     onWarn:       () => Alert.alert('Still there?', ...),
 *     onAutoSubmit: () => handleSubmit(true),
 *     enabled: !submitting,
 *   });
 */
export function useInactivityTimer({
  warnAfterMs = 2 * 60 * 1000,
  autoSubmitAfterMs = 5 * 60 * 1000,
  onWarn,
  onAutoSubmit,
  enabled = true,
}: UseInactivityTimerOptions) {
  const warnTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSubmitTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnFiredRef        = useRef(false);  // prevent duplicate warn alerts
  const autoFiredRef        = useRef(false);  // prevent duplicate auto-submits

  // Use refs so callbacks always see the latest version without
  // having to be listed as resetTimer dependencies.
  const onWarnRef        = useRef(onWarn);
  const onAutoSubmitRef  = useRef(onAutoSubmit);
  onWarnRef.current       = onWarn;
  onAutoSubmitRef.current = onAutoSubmit;

  const clearTimers = useCallback(() => {
    if (warnTimerRef.current)       { clearTimeout(warnTimerRef.current);       warnTimerRef.current = null; }
    if (autoSubmitTimerRef.current) { clearTimeout(autoSubmitTimerRef.current); autoSubmitTimerRef.current = null; }
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    clearTimers();

    // Allow warn alert to fire again after the user resets
    warnFiredRef.current = false;

    warnTimerRef.current = setTimeout(() => {
      if (!warnFiredRef.current) {
        warnFiredRef.current = true;
        onWarnRef.current();
      }
    }, warnAfterMs);

    autoSubmitTimerRef.current = setTimeout(() => {
      if (!autoFiredRef.current) {
        autoFiredRef.current = true;
        onAutoSubmitRef.current();
      }
    }, autoSubmitAfterMs);
  }, [enabled, warnAfterMs, autoSubmitAfterMs, clearTimers]);

  // Start (or restart) timers whenever `enabled` or thresholds change.
  useEffect(() => {
    if (enabled) {
      // Reset fired flags when re-enabled
      warnFiredRef.current  = false;
      autoFiredRef.current  = false;
      resetTimer();
    } else {
      clearTimers();
    }

    return clearTimers;
  }, [enabled, resetTimer, clearTimers]);

  return { resetTimer };
}
