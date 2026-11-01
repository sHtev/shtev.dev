import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scanIn } from '../../src/scripts/portrait';

const LINES = ['row1', 'row2', 'row3'];

describe('scanIn', () => {
  let pre: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    pre = document.createElement('pre');
  });

  afterEach(() => vi.useRealTimers());

  it('drawsRowsTopToBottom', () => {
    scanIn(pre, LINES, { msPerRow: 18, reducedMotion: false });
    vi.advanceTimersByTime(18 * 2);
    expect(pre.textContent).toBe('row1\nrow2');
    vi.advanceTimersByTime(18);
    expect(pre.textContent).toBe('row1\nrow2\nrow3');
  });

  it('reducedMotionShowsAll', () => {
    scanIn(pre, LINES, { msPerRow: 18, reducedMotion: true });
    expect(pre.textContent).toBe('row1\nrow2\nrow3');
  });

  it('stopHalts', () => {
    const scan = scanIn(pre, LINES, { msPerRow: 18, reducedMotion: false });
    vi.advanceTimersByTime(18);
    scan.stop();
    vi.advanceTimersByTime(1000);
    expect(pre.textContent).toBe('row1');
  });
});
