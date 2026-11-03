export interface RotationOptions {
  msPerChar: number;
  holdMs: number;
  gapMs: number;
  reducedMotion: boolean;
}

/** Types each line, holds it, clears it in one go, then moves to the next. */
export function startRotation(el: HTMLElement, lines: string[], opts: RotationOptions): { stop(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => clearTimeout(timer);

  // Reduced motion: no typing, but still a different command each visit.
  if (opts.reducedMotion || lines.length === 0) {
    el.textContent = lines[Math.floor(Math.random() * lines.length)] ?? '';
    return { stop };
  }

  let line = 0;
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
