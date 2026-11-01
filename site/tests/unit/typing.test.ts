import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { typeInto } from '../../src/scripts/typing';

const TEXT = 'abcdefghijklmnop';

describe('typeInto', () => {
  let el: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    el = document.createElement('div');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writesProgressively', () => {
    typeInto(el, TEXT, { msPerTick: 8, charsPerTick: 2, reducedMotion: false });
    vi.advanceTimersByTime(8 * 3);
    expect(el.textContent).toBe('abcdef');
  });

  it('finishWritesAll', async () => {
    const typing = typeInto(el, TEXT, { msPerTick: 8, charsPerTick: 2, reducedMotion: false });
    vi.advanceTimersByTime(8);
    typing.finish();
    expect(el.textContent).toBe(TEXT);
    await expect(typing.done).resolves.toBeUndefined();
  });

  it('resolvesWhenComplete', async () => {
    const typing = typeInto(el, TEXT, { msPerTick: 8, charsPerTick: 2, reducedMotion: false });
    vi.advanceTimersByTime(8 * 10);
    expect(el.textContent).toBe(TEXT);
    await expect(typing.done).resolves.toBeUndefined();
  });

  it('reducedMotionInstant', () => {
    typeInto(el, TEXT, { msPerTick: 8, charsPerTick: 2, reducedMotion: true });
    expect(el.textContent).toBe(TEXT);
  });

  it('cancelStops', () => {
    const typing = typeInto(el, TEXT, { msPerTick: 8, charsPerTick: 2, reducedMotion: false });
    vi.advanceTimersByTime(8);
    typing.cancel();
    vi.advanceTimersByTime(1000);
    expect(el.textContent).toBe('ab');
  });
});
