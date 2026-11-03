import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { typeInto, typeNodes } from '../../src/scripts/typing';

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

describe('typeNodes', () => {
  const OPTS = { msPerTick: 8, charsPerTick: 2, reducedMotion: false };
  let root: HTMLElement;
  const items = () => [...root.querySelectorAll('li')].map((li) => li.style.visibility);

  beforeEach(() => {
    vi.useFakeTimers();
    root = document.createElement('div');
    root.innerHTML = '<p>ab</p><ul><li>cd</li><li>ef</li></ul>';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('listItemsHiddenUntilTypingReachesThem', () => {
    typeNodes(root, OPTS);
    expect(items()).toEqual(['hidden', 'hidden']);
    vi.advanceTimersByTime(8 * 2);
    expect(items()).toEqual(['', 'hidden']);
  });

  it('finishShowsAllListItems', () => {
    typeNodes(root, OPTS).finish();
    expect(items()).toEqual(['', '']);
    expect(root.textContent).toBe('abcdef');
  });
});
