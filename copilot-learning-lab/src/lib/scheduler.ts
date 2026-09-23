/**
 * Cancellable simulation timers.
 *
 * Every simulated delay goes through this scheduler so that pausing,
 * cancelling, restarting or resetting can stop pending work reliably.
 * Timers are keyed ("task:tsk_123:step"), and can be cancelled by key or prefix.
 * Timers are never persisted: after a refresh, pending work is recovered
 * explicitly by the task engine instead of silently resuming.
 */

export type Speed = 'instant' | 'fast' | 'normal' | 'realistic';

export const speedFactor: Record<Speed, number> = {
  instant: 0.05,
  fast: 0.35,
  normal: 1,
  realistic: 1.8,
};

let currentSpeed: Speed = 'fast';
export const setSpeed = (s: Speed) => { currentSpeed = s; };
export const getSpeed = () => currentSpeed;

const timers = new Map<string, ReturnType<typeof setTimeout>>();
let synchronous = false;

/**
 * Run fn with every scheduled callback executed immediately and synchronously.
 * Used to build facilitator "known starting states" without waiting.
 */
export function runSynchronously(fn: () => void) {
  const prev = synchronous;
  synchronous = true;
  try { fn(); } finally { synchronous = prev; }
}

/** Schedule fn after a base duration (ms at "normal" speed). Replaces a timer with the same key. */
export function schedule(key: string, baseMs: number, fn: () => void): void {
  cancel(key);
  if (synchronous) { fn(); return; }
  const ms = Math.max(10, Math.round(baseMs * speedFactor[currentSpeed]));
  const handle = setTimeout(() => {
    timers.delete(key);
    fn();
  }, ms);
  timers.set(key, handle);
}

export function cancel(key: string): void {
  const h = timers.get(key);
  if (h !== undefined) {
    clearTimeout(h);
    timers.delete(key);
  }
}

export function cancelPrefix(prefix: string): void {
  for (const key of [...timers.keys()]) if (key.startsWith(prefix)) cancel(key);
}

export function cancelAll(): void {
  for (const key of [...timers.keys()]) cancel(key);
}

export const isScheduled = (key: string) => timers.has(key);
export const pendingCount = (prefix = '') => [...timers.keys()].filter((k) => k.startsWith(prefix)).length;
