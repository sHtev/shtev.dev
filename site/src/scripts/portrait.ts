/** Draws `lines` into `pre` one row at a time, top to bottom, like a monitor painting a picture. */
export function scanIn(
  pre: HTMLElement,
  lines: string[],
  opts: { msPerRow: number; reducedMotion: boolean },
): { stop(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rows = 0;

  const step = () => {
    rows++;
    pre.textContent = lines.slice(0, rows).join('\n');
    if (rows < lines.length) timer = setTimeout(step, opts.msPerRow);
  };

  if (opts.reducedMotion) {
    pre.textContent = lines.join('\n');
  } else {
    pre.textContent = '';
    timer = setTimeout(step, opts.msPerRow);
  }

  return { stop: () => clearTimeout(timer) };
}
