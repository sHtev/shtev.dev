export interface SelectableListOptions {
  itemSelector: string;
  onChoose(index: number, el: HTMLElement): void;
  numberKeys: boolean;
}

export interface SelectableList {
  selected(): number;
  select(index: number): void;
  destroy(): void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable]') !== null;
}

/** Keyboard/mouse selection over a list of links; the highlighted item carries the `sel` class. */
export function createSelectableList(root: HTMLElement, opts: SelectableListOptions): SelectableList {
  const items = [...root.querySelectorAll<HTMLElement>(opts.itemSelector)];
  let current = 0;
  let lastPointer: { x: number; y: number } | null = null;

  const select = (index: number) => {
    current = (index + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle('sel', i === current));
  };

  const choose = (index: number) => {
    select(index);
    opts.onChoose(current, items[current]);
  };

  const onKey = (e: KeyboardEvent) => {
    if (isTypingTarget(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowDown') select(current + 1);
    else if (e.key === 'ArrowUp') select(current - 1);
    else if (e.key === 'Enter') choose(current);
    else if (opts.numberKeys && /^[1-9]$/.test(e.key) && Number(e.key) <= items.length) choose(Number(e.key) - 1);
    else return;
    e.preventDefault();
  };

  // Only genuine pointer movement moves the highlight, so a resting mouse never fights the keyboard.
  const onMove = (e: MouseEvent) => {
    const moved = !lastPointer || lastPointer.x !== e.clientX || lastPointer.y !== e.clientY;
    lastPointer = { x: e.clientX, y: e.clientY };
    const item = (e.target as Element).closest?.(opts.itemSelector) as HTMLElement | null;
    if (moved && item && items.includes(item)) select(items.indexOf(item));
  };

  // Plain left-clicks are handled here; modified clicks (new tab etc.) fall through to the link.
  const onClick = (e: MouseEvent) => {
    const item = (e.target as Element).closest?.(opts.itemSelector) as HTMLElement | null;
    if (!item || e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    choose(items.indexOf(item));
  };

  document.addEventListener('keydown', onKey);
  root.addEventListener('mousemove', onMove);
  root.addEventListener('click', onClick);
  select(0);

  return {
    selected: () => current,
    select,
    destroy() {
      document.removeEventListener('keydown', onKey);
      root.removeEventListener('mousemove', onMove);
      root.removeEventListener('click', onClick);
    },
  };
}
