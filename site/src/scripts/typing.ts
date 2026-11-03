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

/** Types out every text node under `root` in document order, keeping the markup. */
export function typeNodes(root: HTMLElement, opts: TypingOptions): Typing {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  const texts = nodes.map((n) => n.data);
  // An empty <li> still draws its bullet, so each list item stays hidden until typing reaches it.
  const items = [...root.querySelectorAll('li')];
  const reveal = (n: Text) => {
    for (let el = n.parentElement; el && el !== root; el = el.parentElement) {
      if (el.tagName === 'LI') el.style.visibility = '';
    }
  };

  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  let timer: ReturnType<typeof setTimeout> | undefined;
  let node = 0;
  let shown = 0;

  // Hold the final height while typing, so the page (and its scrollbar) doesn't grow as it types.
  const release = () => (root.style.minHeight = '');

  const finish = () => {
    clearTimeout(timer);
    nodes.forEach((n, i) => (n.data = texts[i]));
    items.forEach((li) => (li.style.visibility = ''));
    release();
    resolve();
  };

  const tick = () => {
    let budget = opts.charsPerTick;
    while (budget > 0 && node < nodes.length) {
      if (shown === 0) reveal(nodes[node]);
      const take = Math.min(budget, texts[node].length - shown);
      shown += take;
      budget -= take;
      nodes[node].data = texts[node].slice(0, shown);
      if (shown === texts[node].length) {
        node++;
        shown = 0;
      }
    }
    if (node < nodes.length) timer = setTimeout(tick, opts.msPerTick);
    else {
      release();
      resolve();
    }
  };

  if (opts.reducedMotion || nodes.length === 0) {
    finish();
  } else {
    root.style.minHeight = `${root.getBoundingClientRect().height}px`;
    nodes.forEach((n) => (n.data = ''));
    items.forEach((li) => (li.style.visibility = 'hidden'));
    timer = setTimeout(tick, opts.msPerTick);
  }

  return { done, finish, cancel: () => clearTimeout(timer) };
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
