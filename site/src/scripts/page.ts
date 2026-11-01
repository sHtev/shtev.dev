import { createSelectableList } from './menu';
import { startRotation } from './prompt';
import { typeInto, typeNodes } from './typing';

type Navigate = (href: string) => void;

const CONTENT_TYPING = { msPerTick: 8, charsPerTick: 2 };
const COMMAND_MS_PER_CHAR = 35;
const ENTER_PAUSE_MS = 200;
const ROTATION = { msPerChar: 70, holdMs: 1600, gapMs: 350 };

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable]') !== null;
}

export interface PageOptions {
  contentEl: HTMLElement | null;
  actionsEl: HTMLElement;
  defaultAction: number;
  navigate: Navigate;
  reducedMotion: boolean;
}

/** Content pages: type the content, then the footer actions become selectable. */
export function initPage(opts: PageOptions): { destroy(): void } {
  const actions = [...opts.actionsEl.querySelectorAll<HTMLElement>('[data-action]')];
  let selected = Math.min(opts.defaultAction, actions.length - 1);
  // Esc/Backspace follow the page's own [ back ] link (a case study goes back to its list).
  const backHref = actions.find((a) => a.textContent?.trim() === '[ back ]')?.getAttribute('href') ?? '/';
  let typed = !opts.contentEl;

  const highlight = () => actions.forEach((a, i) => a.classList.toggle('sel', i === selected));
  const typing = opts.contentEl
    ? typeNodes(opts.contentEl, { ...CONTENT_TYPING, reducedMotion: opts.reducedMotion })
    : null;

  const onTyped = () => {
    typed = true;
    highlight();
  };
  if (typing) typing.done.then(onTyped);
  else highlight();

  const onKey = (e: KeyboardEvent) => {
    if (isTypingTarget(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
    if (!typed) {
      typing?.finish();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const step = e.key === 'ArrowRight' ? 1 : -1;
      selected = (selected + step + actions.length) % actions.length;
      highlight();
    } else if (e.key === 'Enter' && actions[selected]) {
      actions[selected].click();
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      opts.navigate(backHref);
    } else {
      return;
    }
    e.preventDefault();
  };

  const onContentClick = () => typing?.finish();

  document.addEventListener('keydown', onKey);
  opts.contentEl?.addEventListener('click', onContentClick);

  return {
    destroy() {
      typing?.cancel();
      document.removeEventListener('keydown', onKey);
      opts.contentEl?.removeEventListener('click', onContentClick);
    },
  };
}

export interface LandingOptions {
  promptEl: HTMLElement;
  menuEl: HTMLElement;
  lines: string[];
  navigate: Navigate;
  reducedMotion: boolean;
}

/** Landing page: rotating prompt; choosing an item types its command, then opens it. */
export function initLanding(opts: LandingOptions): { destroy(): void } {
  const rotation = startRotation(opts.promptEl, opts.lines, { ...ROTATION, reducedMotion: opts.reducedMotion });
  let pending: ReturnType<typeof setTimeout> | undefined;
  let typing: ReturnType<typeof typeInto> | undefined;
  let chosen = false;

  const list = createSelectableList(opts.menuEl, {
    itemSelector: '.item',
    numberKeys: true,
    onChoose(_index, el) {
      if (chosen) return;
      chosen = true;
      rotation.stop();
      const href = el.getAttribute('href') ?? '/';
      typing = typeInto(opts.promptEl, el.dataset.command ?? '', {
        msPerTick: COMMAND_MS_PER_CHAR,
        charsPerTick: 1,
        reducedMotion: opts.reducedMotion,
      });
      typing.done.then(() => {
        pending = setTimeout(() => opts.navigate(href), opts.reducedMotion ? 0 : ENTER_PAUSE_MS);
      });
    },
  });

  return {
    destroy() {
      rotation.stop();
      typing?.cancel();
      clearTimeout(pending);
      list.destroy();
    },
  };
}
