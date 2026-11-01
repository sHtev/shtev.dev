import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initPage } from '../../src/scripts/page';
import { typeNodes } from '../../src/scripts/typing';

function key(key: string, target: EventTarget = document.body) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('typeNodes', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('keepsMarkupWhileTyping', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p><b>ab</b>cd</p><p>ef</p>';
    typeNodes(root, { msPerTick: 8, charsPerTick: 1, reducedMotion: false });
    vi.advanceTimersByTime(8 * 3);
    expect(root.innerHTML).toBe('<p><b>ab</b>c</p><p></p>');
    vi.advanceTimersByTime(8 * 10);
    expect(root.innerHTML).toBe('<p><b>ab</b>cd</p><p>ef</p>');
  });

  it('finishRestoresEverything', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>hello</p><p>world</p>';
    const typing = typeNodes(root, { msPerTick: 8, charsPerTick: 1, reducedMotion: false });
    typing.finish();
    expect(root.innerHTML).toBe('<p>hello</p><p>world</p>');
  });
});

describe('initPage', () => {
  let content: HTMLElement;
  let actions: HTMLElement;
  let navigate: ReturnType<typeof vi.fn>;
  let page: ReturnType<typeof initPage>;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div id="content"><p>Some page text to type out.</p></div>
      <nav id="actions"><a data-action href="/cv.pdf">[ download ]</a><a data-action href="/">[ back ]</a></nav>
      <input id="field" />`;
    content = document.getElementById('content')!;
    actions = document.getElementById('actions')!;
    navigate = vi.fn();
  });

  afterEach(() => {
    page.destroy();
    vi.useRealTimers();
  });

  const start = (defaultAction = 1) =>
    (page = initPage({ contentEl: content, actionsEl: actions, defaultAction, navigate, reducedMotion: false }));

  const links = () => [...actions.querySelectorAll('a')];

  it('backHighlightsWhenTypingDone', async () => {
    start();
    expect(links()[1].classList.contains('sel')).toBe(false);
    await vi.runAllTimersAsync();
    expect(links()[1].classList.contains('sel')).toBe(true);
  });

  it('anyKeyFinishesTyping', async () => {
    start();
    vi.advanceTimersByTime(8);
    key('x');
    await vi.runAllTimersAsync();
    expect(content.textContent).toBe('Some page text to type out.');
    expect(links()[1].classList.contains('sel')).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('arrowsMoveBetweenActions', async () => {
    start(0);
    await vi.runAllTimersAsync();
    key('ArrowRight');
    expect(links()[1].classList.contains('sel')).toBe(true);
    expect(links()[0].classList.contains('sel')).toBe(false);
  });

  it('enterActivatesSelectedAction', async () => {
    start(0);
    await vi.runAllTimersAsync();
    const clicked = vi.fn((e: Event) => e.preventDefault());
    links()[0].addEventListener('click', clicked);
    key('Enter');
    expect(clicked).toHaveBeenCalled();
  });

  it('escapeGoesHome', async () => {
    start();
    await vi.runAllTimersAsync();
    key('Escape');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('escapeFollowsBackAction', async () => {
    actions.innerHTML = '<a data-action href="/case-studies/">[ back ]</a>';
    start(0);
    await vi.runAllTimersAsync();
    key('Escape');
    expect(navigate).toHaveBeenCalledWith('/case-studies/');
  });

  it('ignoresKeysAlreadyHandled', async () => {
    start();
    await vi.runAllTimersAsync();
    // An earlier handler (e.g. the contact form) has already dealt with this key.
    document.body.addEventListener('keydown', (e) => e.preventDefault(), { once: true });
    key('Backspace');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keysInFormFieldsDoNotNavigate', async () => {
    start();
    await vi.runAllTimersAsync();
    key('Backspace', document.getElementById('field')!);
    key('Escape', document.getElementById('field')!);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('listPageEnterTypesCommandThenNavigates', async () => {
    content.innerHTML = `<ul data-ls>
      <li><a class="item" href="/x/one/" data-command="cat x/one.md">one</a></li>
      <li><a class="item" href="/x/two/" data-command="cat x/two.md">two</a></li></ul>`;
    const promptEl = document.createElement('span');
    page = initPage({
      contentEl: content,
      actionsEl: actions,
      defaultAction: 1,
      navigate,
      reducedMotion: false,
      promptEl,
      listEl: content.querySelector('[data-ls]') as HTMLElement,
    });
    await vi.runAllTimersAsync();
    // The list owns the highlight; footer actions stay unhighlighted.
    expect(links().some((a) => a.classList.contains('sel'))).toBe(false);
    key('ArrowDown');
    key('Enter');
    await vi.runAllTimersAsync();
    expect(promptEl.textContent).toBe('cat x/two.md');
    expect(navigate).toHaveBeenCalledWith('/x/two/');
  });

  it('backIsFocusedWhenTypingDone', async () => {
    start();
    await vi.runAllTimersAsync();
    expect(document.activeElement).toBe(links()[1]);
  });

  it('focusingAnActionHighlightsOnlyIt', async () => {
    start(0);
    await vi.runAllTimersAsync();
    links()[1].focus();
    expect(links()[1].classList.contains('sel')).toBe(true);
    expect(links()[0].classList.contains('sel')).toBe(false);
  });

  it('listPageFocusesFirstItemAndTabToBackMovesHighlight', async () => {
    content.innerHTML = `<ul data-ls>
      <li><a class="item" href="/x/one/" data-command="cat x/one.md">one</a></li></ul>`;
    page = initPage({
      contentEl: content,
      actionsEl: actions,
      defaultAction: 1,
      navigate,
      reducedMotion: false,
      promptEl: document.createElement('span'),
      listEl: content.querySelector('[data-ls]') as HTMLElement,
    });
    await vi.runAllTimersAsync();
    const item = content.querySelector<HTMLElement>('.item')!;
    expect(document.activeElement).toBe(item);
    expect(item.classList.contains('sel')).toBe(true);
    links()[1].focus();
    expect(item.classList.contains('sel')).toBe(false);
    expect(links()[1].classList.contains('sel')).toBe(true);
    key('Enter');
    expect(navigate).not.toHaveBeenCalledWith('/x/one/');
  });

  it('listDownFromLastGoesToBackAndStays', async () => {
    content.innerHTML = `<ul data-ls>
      <li><a class="item" href="/x/one/" data-command="cat x/one.md">one</a></li>
      <li><a class="item" href="/x/two/" data-command="cat x/two.md">two</a></li></ul>`;
    page = initPage({
      contentEl: content,
      actionsEl: actions,
      defaultAction: 1,
      navigate,
      reducedMotion: false,
      promptEl: document.createElement('span'),
      listEl: content.querySelector('[data-ls]') as HTMLElement,
    });
    await vi.runAllTimersAsync();
    const items = [...content.querySelectorAll<HTMLElement>('.item')];
    key('ArrowDown');
    key('ArrowDown');
    expect(document.activeElement).toBe(links()[1]);
    expect(links()[1].classList.contains('sel')).toBe(true);
    key('ArrowDown');
    expect(document.activeElement).toBe(links()[1]);
    key('ArrowUp');
    expect(document.activeElement).toBe(items[1]);
    expect(items[1].classList.contains('sel')).toBe(true);
  });

  it('focusAfterTypingOverridesBack', async () => {
    const field = document.getElementById('field')!;
    page = initPage({ contentEl: content, actionsEl: actions, defaultAction: 1, navigate, reducedMotion: false, focusAfterTyping: field });
    await vi.runAllTimersAsync();
    expect(document.activeElement).toBe(field);
    expect(links().some((a) => a.classList.contains('sel'))).toBe(false);
  });

  it('pageWithoutContentHighlightsImmediately', () => {
    page = initPage({ contentEl: null, actionsEl: actions, defaultAction: 1, navigate, reducedMotion: false });
    expect(links()[1].classList.contains('sel')).toBe(true);
  });
});
