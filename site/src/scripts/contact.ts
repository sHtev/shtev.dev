const STEPS = ['name', 'email', 'message', 'confirm'] as const;
type Step = (typeof STEPS)[number];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FALLBACK_ERROR = 'error: something went wrong, email hello@shtev.dev';

export interface ContactFlowOptions {
  fetch?: typeof fetch;
  /** Called once a message has gone, e.g. to select [ back ]. */
  onSent?: () => void;
}

/**
 * Turns the plain contact form into terminal prompts shown one at a time.
 * Enter or [ next ] moves on; y/n or [ yes ]/[ no ] answers the confirm prompt.
 */
export function initContactFlow(form: HTMLFormElement, opts: ContactFlowOptions = {}): { destroy(): void } {
  const doFetch = opts.fetch ?? window.fetch.bind(window);
  const step = (name: Step) => form.querySelector<HTMLElement>(`[data-step="${name}"]`)!;
  const field = (name: Step) => step(name).querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
  const submitRow = form.querySelector<HTMLElement>('.submit')!;
  const statusEl = form.querySelector<HTMLElement>('[data-status]')!;
  const nextRow = form.querySelector<HTMLElement>('.next')!;
  const nextButton = nextRow.querySelector<HTMLButtonElement>('[data-next]')!;
  const yesButton = form.querySelector<HTMLButtonElement>('[data-yes]')!;
  const noButton = form.querySelector<HTMLButtonElement>('[data-no]')!;
  let current: Step = 'name';
  let sending = false;

  const say = (text: string) => (statusEl.textContent = text);

  const show = (name: Step) => {
    current = name;
    const upTo = STEPS.indexOf(name);
    STEPS.forEach((s, i) => step(s).classList.toggle('hidden', i > upTo));
    nextRow.classList.toggle('hidden', name === 'confirm');
    (field(name) ?? yesButton).focus();
  };

  const value = (name: Step) => field(name)?.value.trim() ?? '';

  const problem = (name: Step): string | null => {
    if (!value(name)) return `error: ${name} required`;
    if (name === 'email' && !EMAIL.test(value('email'))) return 'error: email looks wrong';
    return null;
  };

  const send = async () => {
    sending = true;
    say('sending…');
    const body = Object.fromEntries(new FormData(form)) as Record<string, string>;
    try {
      const res = await doFetch(form.getAttribute('action') ?? '/api/contact', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        say('message sent ✓');
        form.reset();
        // The prompts go; only the status line stays.
        STEPS.forEach((s) => step(s).classList.add('hidden'));
        submitRow.classList.add('hidden');
        nextRow.classList.add('hidden');
        opts.onSent?.();
      } else {
        say(res.status === 429 ? 'error: too many messages, try later' : FALLBACK_ERROR);
      }
    } catch {
      say(FALLBACK_ERROR);
    } finally {
      sending = false;
    }
  };

  const advance = () => {
    const error = problem(current);
    if (error) return void say(error);
    say('');
    show(STEPS[STEPS.indexOf(current) + 1]);
  };

  const restart = () => {
    say('');
    show('name');
  };

  const onKey = (e: KeyboardEvent) => {
    if (sending) return;
    if (current === 'confirm') {
      if (e.key === 'y' || e.key === 'Y') void send();
      else if (e.key === 'n' || e.key === 'N') restart();
      else if (e.key === 'Backspace') {
        show('message'); // back to editing, never off the page
      } else return;
      e.preventDefault();
      return;
    }
    // Enter moves on; Shift+Enter keeps its newline in the message.
    if (e.key !== 'Enter' || e.shiftKey || e.target === nextButton) return;
    e.preventDefault();
    advance();
  };

  const onNext = () => advance();
  const onYes = () => {
    if (!sending) void send();
  };

  // The no-JS form's [ send ] still goes through fetch when JS is on, so the page doesn't change.
  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const error = (['name', 'email', 'message'] as Step[]).map(problem).find(Boolean);
    if (error) return void say(error);
    void send();
  };

  form.classList.add('terminal');
  submitRow.classList.add('hidden');
  form.addEventListener('keydown', onKey);
  form.addEventListener('submit', onSubmit);
  nextButton.addEventListener('click', onNext);
  yesButton.addEventListener('click', onYes);
  noButton.addEventListener('click', restart);
  show('name');

  return {
    destroy() {
      form.removeEventListener('keydown', onKey);
      form.removeEventListener('submit', onSubmit);
      nextButton.removeEventListener('click', onNext);
      yesButton.removeEventListener('click', onYes);
      noButton.removeEventListener('click', restart);
    },
  };
}
