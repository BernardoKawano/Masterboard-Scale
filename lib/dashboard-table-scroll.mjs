import { shouldShowScrollHint } from './dashboard-ui.mjs';
import { getTableScrollHintText, isCoarsePointer } from './dashboard-mobile.mjs';

const DEFAULT_IGNORE_SELECTOR = 'input, button, a, summary, select, textarea, label';
const KANBAN_IGNORE_SELECTOR = `${DEFAULT_IGNORE_SELECTOR}, .kanban-drag-handle`;

export function canScrollHorizontally(scroller) {
  if (!scroller) return false;
  return scroller.scrollWidth > scroller.clientWidth + 1;
}

export function shouldIgnoreHorizontalPan(target, ignoreSelector = DEFAULT_IGNORE_SELECTOR) {
  return Boolean(target?.closest?.(ignoreSelector));
}

export function getHorizontalPanIgnoreSelector(wrap) {
  return wrap?.dataset?.scrollMode === 'kanban' ? KANBAN_IGNORE_SELECTOR : DEFAULT_IGNORE_SELECTOR;
}

export function updateTableScrollState(scroller, wrap) {
  if (!scroller || !wrap) return { showHint: false, canScrollX: false };

  const showHint = shouldShowScrollHint(scroller.scrollWidth, scroller.clientWidth, scroller.scrollLeft);
  const canScrollX = canScrollHorizontally(scroller);

  wrap.classList.toggle('can-scroll', showHint);
  wrap.classList.toggle('can-scroll-x', canScrollX);
  scroller.dataset.scrollX = String(Math.round(scroller.scrollLeft));

  const hint = wrap.querySelector('.table-scroll-hint');
  if (hint) {
    hint.textContent = getTableScrollHintText(isCoarsePointer());
    hint.hidden = !showHint;
  }

  return { showHint, canScrollX };
}

/**
 * Scroll horizontal fluido: hint, Shift+roda e arrastar para deslocar.
 */
export function bindHorizontalScroller(wrap, options = {}) {
  const scrollerSelector = options.scrollerSelector || '.table-scroll';
  const ignoreSelector = options.ignoreSelector || getHorizontalPanIgnoreSelector(wrap);
  const scroller = wrap?.querySelector?.(scrollerSelector);
  if (!scroller || wrap.dataset.scrollBound === '1') return;

  wrap.dataset.scrollBound = '1';

  const update = () => updateTableScrollState(scroller, wrap);

  scroller.addEventListener('scroll', update, { passive: true });

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    const content = scroller.querySelector('table') || scroller.firstElementChild;
    if (content && content !== scroller) observer.observe(content);
  } else {
    window.addEventListener('resize', update);
  }

  scroller.addEventListener('wheel', (event) => {
    if (!event.shiftKey || !canScrollHorizontally(scroller)) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    scroller.scrollLeft += event.deltaY;
    event.preventDefault();
  }, { passive: false });

  let drag = null;

  scroller.addEventListener('mousedown', (event) => {
    if (isCoarsePointer()) return;
    if (event.button !== 0) return;
    if (!canScrollHorizontally(scroller)) return;
    if (shouldIgnoreHorizontalPan(event.target, ignoreSelector)) return;
    drag = { startX: event.pageX, startLeft: scroller.scrollLeft };
    scroller.classList.add('is-dragging');
  });

  window.addEventListener('mousemove', (event) => {
    if (!drag) return;
    scroller.scrollLeft = drag.startLeft - (event.pageX - drag.startX);
    update();
  });

  window.addEventListener('mouseup', () => {
    if (!drag) return;
    drag = null;
    scroller.classList.remove('is-dragging');
  });

  update();
}

export function bindTableScroller(wrap) {
  bindHorizontalScroller(wrap);
}

export function bindAllTableScrollers(root = document) {
  root.querySelectorAll('[data-scroll-hint]').forEach((wrap) => bindHorizontalScroller(wrap));
}
