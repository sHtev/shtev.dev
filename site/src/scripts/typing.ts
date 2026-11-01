export interface TypingOptions {
  msPerTick: number;
  charsPerTick: number;
  reducedMotion: boolean;
}

export interface Typing {
  done: Promise<void>;
  finish(): void;
  cancel(): void;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Writes `text` into `el` a few characters at a time. */
export function typeInto(el: HTMLElement, text: string, opts: TypingOptions): Typing {
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  let timer: ReturnType<typeof setTimeout> | undefined;
  let shown = 0;

  const finish = () => {
    clearTimeout(timer);
    el.textContent = text;
    resolve();
  };

  const tick = () => {
    shown = Math.min(text.length, shown + opts.charsPerTick);
    el.textContent = text.slice(0, shown);
    if (shown < text.length) timer = setTimeout(tick, opts.msPerTick);
    else resolve();
  };

  if (opts.reducedMotion || text.length === 0) {
    finish();
  } else {
    el.textContent = '';
    timer = setTimeout(tick, opts.msPerTick);
  }

  return { done, finish, cancel: () => clearTimeout(timer) };
}
