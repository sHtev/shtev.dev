export interface RotationOptions {
  msPerChar: number;
  holdMs: number;
  gapMs: number;
  reducedMotion: boolean;
}

const REDUCED_MOTION_SWAP_MS = 4000;

/** Types each line, holds it, clears it in one go, then moves to the next. */
export function startRotation(el: HTMLElement, lines: string[], opts: RotationOptions): { stop(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => clearTimeout(timer);

  let line = 0;

  // Reduced motion: no typing; start on a random command and swap whole lines.
  if (opts.reducedMotion || lines.length === 0) {
    line = Math.floor(Math.random() * lines.length);
    const swap = () => {
      el.textContent = lines[line] ?? '';
      line = (line + 1) % lines.length;
      if (lines.length > 1) timer = setTimeout(swap, REDUCED_MOTION_SWAP_MS);
    };
    swap();
    return { stop };
  }

  let shown = 0;

  const clear = () => {
    el.textContent = '';
    line = (line + 1) % lines.length;
    shown = 0;
    timer = setTimeout(step, opts.gapMs + opts.msPerChar);
  };

  const step = () => {
    const text = lines[line];
    shown++;
    el.textContent = text.slice(0, shown);
    timer = shown < text.length ? setTimeout(step, opts.msPerChar) : setTimeout(clear, opts.holdMs);
  };

  el.textContent = '';
  timer = setTimeout(step, opts.msPerChar);
  return { stop };
}
