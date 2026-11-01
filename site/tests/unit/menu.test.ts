import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSelectableList } from '../../src/scripts/menu';

function key(key: string, target: EventTarget = document.body) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function move(el: Element, x: number, y: number) {
  el.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
}

describe('createSelectableList', () => {
  let root: HTMLElement;
  let items: HTMLElement[];
  let onChoose: ReturnType<typeof vi.fn>;
  let list: ReturnType<typeof createSelectableList>;

  beforeEach(() => {
    document.body.innerHTML = `
      <nav id="menu">
        <a class="item" href="/a">1</a><a class="item" href="/b">2</a>
        <a class="item" href="/c">3</a><a class="item" href="/d">4</a>
      </nav>
      <input id="field" />`;
    root = document.getElementById('menu')!;
    items = [...root.querySelectorAll<HTMLElement>('.item')];
    onChoose = vi.fn();
    list = createSelectableList(root, { itemSelector: '.item', onChoose, numberKeys: true });
  });

  afterEach(() => list.destroy());

  it('startsOnFirstItem', () => {
    expect(list.selected()).toBe(0);
    expect(items[0].classList.contains('sel')).toBe(true);
  });

  it('arrowDownWraps', () => {
    list.select(3);
    key('ArrowDown');
    expect(list.selected()).toBe(0);
  });

  it('arrowUpWraps', () => {
    key('ArrowUp');
    expect(list.selected()).toBe(3);
    expect(items[3].classList.contains('sel')).toBe(true);
    expect(items[0].classList.contains('sel')).toBe(false);
  });

  it('enterChoosesSelected', () => {
    key('ArrowDown');
    key('Enter');
    expect(onChoose).toHaveBeenCalledWith(1, items[1]);
  });

  it('numberKeyChooses', () => {
    key('3');
    expect(onChoose).toHaveBeenCalledWith(2, items[2]);
    expect(list.selected()).toBe(2);
  });

  it('clickChooses', () => {
    items[3].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(onChoose).toHaveBeenCalledWith(3, items[3]);
  });

  it('restingPointerDoesNotFightKeyboard', () => {
    move(items[0], 10, 10);
    key('ArrowDown');
    key('ArrowDown');
    move(items[0], 10, 10);
    move(items[0], 10, 10);
    expect(list.selected()).toBe(2);
  });

  it('realMouseMoveSelects', () => {
    move(items[0], 10, 10);
    move(items[3], 10, 60);
    expect(list.selected()).toBe(3);
  });

  it('ignoresKeysFromFormFields', () => {
    const field = document.getElementById('field')!;
    key('ArrowDown', field);
    key('2', field);
    key('Enter', field);
    expect(list.selected()).toBe(0);
    expect(onChoose).not.toHaveBeenCalled();
  });

  it('ignoresModifiedKeys', () => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '2', metaKey: true, bubbles: true }));
    expect(onChoose).not.toHaveBeenCalled();
  });

  it('arrowMovesFocusWithHighlight', () => {
    key('ArrowDown');
    expect(document.activeElement).toBe(items[1]);
  });

  it('focusMovesHighlight', () => {
    items[2].focus();
    expect(list.selected()).toBe(2);
    expect(items[2].classList.contains('sel')).toBe(true);
    expect(items[0].classList.contains('sel')).toBe(false);
  });

  it('clearRemovesHighlight', () => {
    list.clear();
    expect(items.some((el) => el.classList.contains('sel'))).toBe(false);
    key('ArrowDown');
    expect(list.selected()).toBe(1);
  });

  it('noWrapStopsAtEndsAndReportsPastEnd', () => {
    list.destroy();
    const onPastEnd = vi.fn();
    list = createSelectableList(root, { itemSelector: '.item', onChoose, numberKeys: false, wrap: false, onPastEnd });
    key('ArrowUp');
    expect(list.selected()).toBe(0);
    list.select(3);
    key('ArrowDown');
    expect(list.selected()).toBe(3);
    expect(onPastEnd).toHaveBeenCalledTimes(1);
  });

  it('destroyStopsListening', () => {
    list.destroy();
    key('ArrowDown');
    expect(list.selected()).toBe(0);
  });
});
