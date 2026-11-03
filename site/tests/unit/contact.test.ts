import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { initContactFlow } from '../../src/scripts/contact';

const FORM = `
  <form method="post" action="/api/contact" data-contact>
    <p class="field" data-step="name"><label for="c-name">name:</label> <input id="c-name" name="name" required /></p>
    <p class="field" data-step="email"><label for="c-email">email:</label> <input id="c-email" name="email" type="email" required /></p>
    <p class="field" data-step="message"><label for="c-message">message:</label> <textarea id="c-message" name="message" required></textarea></p>
    <p class="hp"><input name="website" /></p>
    <p class="field" data-step="confirm" tabindex="-1">send? [y/n]</p>
    <p class="submit"><button type="submit">[ send ]</button></p>
    <p data-status role="status"></p>
  </form>
  <a href="#" data-plain>[ plain form ]</a>`;

function key(target: Element, key: string, extra: KeyboardEventInit = {}) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra }));
}

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const visible = (step: string) => !$(`[data-step="${step}"]`).classList.contains('hidden');
const status = () => $('[data-status]').textContent;

describe('initContactFlow', () => {
  let fetchMock: Mock<typeof fetch>;
  let onSent: Mock<() => void>;

  beforeEach(() => {
    document.body.innerHTML = FORM;
    fetchMock = vi.fn<typeof fetch>();
    onSent = vi.fn<() => void>();
    initContactFlow($<HTMLFormElement>('form'), { fetch: fetchMock, onSent });
  });

  function fill(sel: string, value: string) {
    const el = $<HTMLInputElement>(sel);
    el.value = value;
    key(el, 'Enter');
  }

  it('startsWithNameOnly', () => {
    expect(visible('name')).toBe(true);
    expect(visible('email')).toBe(false);
    expect(visible('confirm')).toBe(false);
  });

  it('stepsInOrder', () => {
    fill('#c-name', 'Ada');
    expect(visible('email')).toBe(true);
    expect(document.activeElement).toBe($('#c-email'));
    fill('#c-email', 'ada@example.com');
    expect(visible('message')).toBe(true);
    fill('#c-message', 'Hello');
    expect(visible('confirm')).toBe(true);
  });

  it('emptyNameShowsError', () => {
    fill('#c-name', '   ');
    expect(status()).toBe('error: name required');
    expect(visible('email')).toBe(false);
  });

  it('badEmailShowsError', () => {
    fill('#c-name', 'Ada');
    fill('#c-email', 'not-an-email');
    expect(status()).toBe('error: email looks wrong');
    expect(visible('message')).toBe(false);
  });

  it('shiftEnterInMessageIsANewline', () => {
    fill('#c-name', 'Ada');
    fill('#c-email', 'ada@example.com');
    key($('#c-message'), 'Enter', { shiftKey: true });
    expect(visible('confirm')).toBe(false);
  });

  it('noReturnsToNameKeepingValues', () => {
    fill('#c-name', 'Ada');
    fill('#c-email', 'ada@example.com');
    fill('#c-message', 'Hello');
    key($('[data-step="confirm"]'), 'n');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.activeElement).toBe($('#c-name'));
    expect($<HTMLInputElement>('#c-name').value).toBe('Ada');
  });

  it('backspaceAtConfirmReturnsToMessage', () => {
    fill('#c-name', 'Ada');
    fill('#c-email', 'ada@example.com');
    fill('#c-message', 'Hello');
    const confirm = $('[data-step="confirm"]');
    const ev = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true });
    confirm.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe($('#c-message'));
    expect(visible('confirm')).toBe(false);
  });

  it('yesSubmitsJson', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    fill('#c-name', 'Ada');
    fill('#c-email', 'ada@example.com');
    fill('#c-message', 'Hello');
    key($('[data-step="confirm"]'), 'y');
    await vi.waitFor(() => expect(status()).toBe('message sent ✓'));
    const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(url).toBe('/api/contact');
    expect(init.headers.Accept).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ name: 'Ada', email: 'ada@example.com', message: 'Hello', website: '' });
  });

  it('plainLinkHiddenFromMessageOn', () => {
    const plainHidden = () => $('[data-plain]').classList.contains('hidden');
    fill('#c-name', 'Ada');
    fill('#c-email', 'ada@example.com');
    expect(plainHidden()).toBe(true);
    fill('#c-message', 'Hello');
    key($('[data-step="confirm"]'), 'n');
    expect(plainHidden()).toBe(false);
  });

  it('sentHidesFormAndCallsOnSent', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    fill('#c-name', 'Ada');
    fill('#c-email', 'ada@example.com');
    fill('#c-message', 'Hello');
    key($('[data-step="confirm"]'), 'y');
    await vi.waitFor(() => expect(onSent).toHaveBeenCalledOnce());
    for (const step of ['name', 'email', 'message', 'confirm']) expect(visible(step)).toBe(false);
    expect($('.submit').classList.contains('hidden')).toBe(true);
    expect(status()).toBe('message sent ✓');
  });

  it('failedSendKeepsForm', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }));
    fill('#c-name', 'Ada');
    fill('#c-email', 'ada@example.com');
    fill('#c-message', 'Hello');
    key($('[data-step="confirm"]'), 'y');
    await vi.waitFor(() => expect(status()).toMatch(/^error/));
    expect(onSent).not.toHaveBeenCalled();
    expect(visible('confirm')).toBe(true);
  });

  it('rendersRateLimit', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 429 }));
    fill('#c-name', 'Ada');
    fill('#c-email', 'ada@example.com');
    fill('#c-message', 'Hello');
    key($('[data-step="confirm"]'), 'y');
    await vi.waitFor(() => expect(status()).toBe('error: too many messages, try later'));
  });

  it('rendersNetworkFailure', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'));
    fill('#c-name', 'Ada');
    fill('#c-email', 'ada@example.com');
    fill('#c-message', 'Hello');
    key($('[data-step="confirm"]'), 'y');
    await vi.waitFor(() => expect(status()).toBe('error: something went wrong, email hello@shtev.dev'));
  });

  it('plainFormShowsEverything', () => {
    $<HTMLAnchorElement>('[data-plain]').click();
    for (const step of ['name', 'email', 'message']) expect(visible(step)).toBe(true);
    expect(visible('confirm')).toBe(false);
    expect($('.submit').classList.contains('hidden')).toBe(false);
  });
});
