import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canScrollHorizontally,
  getHorizontalPanIgnoreSelector,
  shouldIgnoreHorizontalPan,
  updateTableScrollState,
} from '../lib/dashboard-table-scroll.mjs';

test('detecta overflow horizontal da tabela', () => {
  assert.equal(canScrollHorizontally({ scrollWidth: 1200, clientWidth: 800 }), true);
  assert.equal(canScrollHorizontally({ scrollWidth: 800, clientWidth: 800 }), false);
});

test('atualiza classes e hint do wrapper de scroll', () => {
  const scroller = {
    scrollWidth: 1400,
    clientWidth: 900,
    scrollLeft: 0,
    dataset: {},
  };
  const hint = { hidden: true };
  const wrap = {
    classList: {
      values: new Set(),
      toggle(name, on) {
        if (on) this.values.add(name);
        else this.values.delete(name);
      },
    },
    querySelector: () => hint,
  };

  const state = updateTableScrollState(scroller, wrap);
  assert.equal(state.showHint, true);
  assert.equal(state.canScrollX, true);
  assert.equal(wrap.classList.values.has('can-scroll'), true);
  assert.equal(wrap.classList.values.has('can-scroll-x'), true);
  assert.equal(hint.hidden, false);
  assert.equal(scroller.dataset.scrollX, '0');
});

test('ignora arraste horizontal na alça do kanban', () => {
  const handle = {
    closest(selector) {
      if (selector.includes('kanban-drag-handle')) return handle;
      return null;
    },
  };
  const column = {
    closest() {
      return null;
    },
  };
  const ignore = getHorizontalPanIgnoreSelector({ dataset: { scrollMode: 'kanban' } });

  assert.equal(shouldIgnoreHorizontalPan(handle, ignore), true);
  assert.equal(shouldIgnoreHorizontalPan(column, ignore), false);
  assert.equal(ignore, '.kanban-drag-handle');
});
