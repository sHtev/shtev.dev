import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startRotation } from '../../src/scripts/prompt';

const LINES = ['abc', 'wxyz'];
const OPTS = { msPerChar: 70, holdMs: 1600, gapMs: 350, reducedMotion: false };
// Time to type 'abc' fully: one tick per character after the empty first frame.
const TYPE_ABC = 70 * 3;

describe('startRotation', () => {
  let el: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    el = document.createElement('div');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('typesFirstLine', () => {
    startRotation(el, LINES, OPTS);
    vi.advanceTimersByTime(TYPE_ABC);
    expect(el.textContent).toBe('abc');
  });

  it('clearsInstantly', () => {
    startRotation(el, LINES, OPTS);
    vi.advanceTimersByTime(TYPE_ABC);
    const seen = new Set<string>();
    // Step through the hold and the clear in small increments.
    for (let t = 0; t < OPTS.holdMs + 50; t += 10) {
      vi.advanceTimersByTime(10);
      seen.add(el.textContent ?? '');
    }
    // Never a shrinking prefix like 'ab' or 'a' — straight from 'abc' to ''.
    expect([...seen].sort()).toEqual(['', 'abc']);
  });

  it('advances', () => {
    startRotation(el, LINES, OPTS);
    vi.advanceTimersByTime(TYPE_ABC + OPTS.holdMs + OPTS.gapMs + 70 * 2);
    expect(el.textContent).toBe('wx');
  });

  it('reducedMotionStartsOnRandomLine', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    startRotation(el, LINES, { ...OPTS, reducedMotion: true });
    expect(el.textContent).toBe('wxyz');
    vi.restoreAllMocks();
  });

  it('reducedMotionSwapsWholeLines', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    startRotation(el, LINES, { ...OPTS, reducedMotion: true });
    const seen = new Set<string>();
    for (let t = 0; t < 10_000; t += 50) {
      vi.advanceTimersByTime(50);
      seen.add(el.textContent ?? '');
    }
    expect([...seen].sort()).toEqual(['abc', 'wxyz']); // never partial, never empty
    vi.restoreAllMocks();
  });

  it('stopHalts', () => {
    const rotation = startRotation(el, LINES, OPTS);
    vi.advanceTimersByTime(70);
    rotation.stop();
    const before = el.textContent;
    vi.advanceTimersByTime(60_000);
    expect(el.textContent).toBe(before);
  });
});
