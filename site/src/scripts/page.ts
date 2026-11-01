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

/** Types `command` into the prompt, pauses as if Enter was pressed, then navigates. */
function runCommand(promptEl: HTMLElement, command: string, href: string, navigate: Navigate, reducedMotion: boolean) {
  let pending: ReturnType<typeof setTimeout> | undefined;
  const typing = typeInto(promptEl, command, { msPerTick: COMMAND_MS_PER_CHAR, charsPerTick: 1, reducedMotion });
  typing.done.then(() => {
    pending = setTimeout(() => navigate(href), reducedMotion ? 0 : ENTER_PAUSE_MS);
  });
  return {
    cancel() {
      typing.cancel();
      clearTimeout(pending);
    },
  };
}

export interface PageOptions {
  contentEl: HTMLElement | null;
  actionsEl: HTMLElement;
  defaultAction: number;
  navigate: Navigate;
  reducedMotion: boolean;
  /** ls-style list pages: the list and the prompt its commands are typed into. */
  listEl?: HTMLElement | null;
  promptEl?: HTMLElement;
  /** Focus this (e.g. the contact form's first field) instead of [ back ] once typing finishes. */
  focusAfterTyping?: HTMLElement | null;
}

/** Content pages: type the content, then the footer actions become selectable. */
export function initPage(opts: PageOptions): { destroy(): void } {
  const actions = [...opts.actionsEl.querySelectorAll<HTMLElement>('[data-action]')];
  let selected = Math.min(opts.defaultAction, actions.length - 1);
  // Esc/Backspace follow the page's own [ back ] link (a case study goes back to its list).
  const backIndex = Math.max(0, actions.findIndex((a) => a.textContent?.trim() === '[ back ]'));
  const backHref = actions[backIndex]?.getAttribute('href') ?? '/';
  let typed = !opts.contentEl;

  const markAction = () => actions.forEach((a, i) => a.classList.toggle('sel', i === selected));
  const clearActions = () => actions.forEach((a) => a.classList.remove('sel'));
  const focusAction = () => {
    markAction();
    actions[selected]?.focus();
  };
  const typing = opts.contentEl
    ? typeNodes(opts.contentEl, { ...CONTENT_TYPING, reducedMotion: opts.reducedMotion })
    : null;

  let list: ReturnType<typeof createSelectableList> | undefined;
  let command: ReturnType<typeof runCommand> | undefined;

  const onTyped = () => {
    typed = true;
    if (opts.focusAfterTyping) opts.focusAfterTyping.focus();
    else if (!opts.listEl) focusAction();
    if (opts.listEl && opts.promptEl) {
      const promptEl = opts.promptEl;
      list = createSelectableList(opts.listEl, {
        itemSelector: '.item',
        numberKeys: false,
        focusOnStart: true,
        wrap: false,
        // Down from the last item moves on to the footer's [ back ].
        onPastEnd: () => {
          selected = backIndex;
          focusAction();
        },
        onChoose(_index, el) {
          if (command) return;
          command = runCommand(promptEl, el.dataset.command ?? '', el.getAttribute('href') ?? '/', opts.navigate, opts.reducedMotion);
        },
      });
    }
  };
  if (typing) typing.done.then(onTyped);
  else focusAction();

  const inActions = () => opts.actionsEl.contains(document.activeElement);

  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || isTypingTarget(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
    if (!typed) {
      typing?.finish();
      return;
    }
    // With a list on the page, the footer actions only take keys once they have focus.
    const actionsActive = !list || inActions();
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && actionsActive) {
      const step = e.key === 'ArrowRight' ? 1 : -1;
      selected = (selected + step + actions.length) % actions.length;
      focusAction();
    } else if (e.key === 'ArrowUp' && list && inActions()) {
      list.select(-1); // -1 wraps to the last item
    } else if (e.key === 'ArrowDown' && list && inActions()) {
      // Already at the bottom: stay on the action.
    } else if (e.key === 'Enter' && actions[selected] && actionsActive) {
      actions[selected].click();
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      opts.navigate(backHref);
    } else {
      return;
    }
    e.preventDefault();
  };

  const onContentClick = () => typing?.finish();

  // Whatever has focus is the one highlight on the page.
  const onFocus = (e: FocusEvent) => {
    const index = actions.indexOf(e.target as HTMLElement);
    if (index >= 0) {
      selected = index;
      markAction();
      list?.clear();
    } else {
      clearActions();
      if (!opts.listEl?.contains(e.target as Node)) list?.clear();
    }
  };

  document.addEventListener('keydown', onKey);
  document.addEventListener('focusin', onFocus);
  opts.contentEl?.addEventListener('click', onContentClick);

  return {
    destroy() {
      typing?.cancel();
      command?.cancel();
      list?.destroy();
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocus);
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
  let command: ReturnType<typeof runCommand> | undefined;

  const list = createSelectableList(opts.menuEl, {
    itemSelector: '.item',
    numberKeys: true,
    focusOnStart: true,
    onChoose(_index, el) {
      if (command) return;
      rotation.stop();
      command = runCommand(opts.promptEl, el.dataset.command ?? '', el.getAttribute('href') ?? '/', opts.navigate, opts.reducedMotion);
    },
  });

  // Focus elsewhere (e.g. the GitHub link) takes the highlight away from the menu.
  const onFocus = (e: FocusEvent) => {
    if (!opts.menuEl.contains(e.target as Node)) list.clear();
  };
  document.addEventListener('focusin', onFocus);

  return {
    destroy() {
      rotation.stop();
      command?.cancel();
      list.destroy();
      document.removeEventListener('focusin', onFocus);
    },
  };
}
