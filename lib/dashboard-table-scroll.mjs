import { shouldShowScrollHint } from './dashboard-ui.mjs';
import { getTableScrollHintText, isCoarsePointer } from './dashboard-mobile.mjs';

const DEFAULT_IGNORE_SELECTOR = 'input, button, a, summary, select, textarea, label';
const KANBAN_IGNORE_SELECTOR = '.kanban-drag-handle';
const PAN_DRAG_THRESHOLD_PX = 4;

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

export function refreshHorizontalScroller(wrap) {
  if (!wrap) return { showHint: false, canScrollX: false };
  const scroller = wrap.querySelector('.kanban-scroll') || wrap.querySelector('.table-scroll');
  return updateTableScrollState(scroller, wrap);
}

/**
 * Scroll horizontal fluido: hint, Shift+roda e arrastar para deslocar.
 */
export function bindHorizontalScroller(wrap, options = {}) {
  const scrollerSelector = options.scrollerSelector
    || (wrap?.dataset?.scrollMode === 'kanban' ? '.kanban-scroll' : '.table-scroll');
  const ignoreSelector = options.ignoreSelector || getHorizontalPanIgnoreSelector(wrap);
  const scroller = wrap?.querySelector?.(scrollerSelector);
  if (!scroller || wrap.dataset.scrollBound === '1') return;

  wrap.dataset.scrollBound = '1';

  const update = () => updateTableScrollState(scroller, wrap);

  scroller.addEventListener('scroll', update, { passive: true });

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    const content = scroller.querySelector('.kanban')
      || scroller.querySelector('table')
      || scroller.firstElementChild;
    if (content && content !== scroller) observer.observe(content);
  } else {
    window.addEventListener('resize', update);
  }

  scroller.addEventListener('wheel', (event) => {
    if (!canScrollHorizontally(scroller)) return;
    if (event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      scroller.scrollLeft += event.deltaY;
      event.preventDefault();
      return;
    }
    if (!event.shiftKey && Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      event.preventDefault();
      scroller.scrollLeft += event.deltaX;
    }
  }, { passive: false });

  let drag = null;
  let dragMoved = false;
  let suppressClick = false;

  scroller.addEventListener('mousedown', (event) => {
    if (isCoarsePointer()) return;
    if (event.button !== 0) return;
    if (!canScrollHorizontally(scroller)) return;
    if (shouldIgnoreHorizontalPan(event.target, ignoreSelector)) return;
    dragMoved = false;
    suppressClick = false;
    drag = { startX: event.pageX, startLeft: scroller.scrollLeft };
    scroller.classList.add('is-dragging');
  });

  window.addEventListener('mousemove', (event) => {
    if (!drag) return;
    const deltaX = event.pageX - drag.startX;
    if (Math.abs(deltaX) >= PAN_DRAG_THRESHOLD_PX) dragMoved = true;
    if (!dragMoved) return;
    scroller.scrollLeft = drag.startLeft - deltaX;
    update();
  });

  window.addEventListener('mouseup', () => {
    if (!drag) return;
    suppressClick = dragMoved;
    drag = null;
    scroller.classList.remove('is-dragging');
  });

  scroller.addEventListener('click', (event) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  update();
}

export function bindTableScroller(wrap) {
  bindHorizontalScroller(wrap);
}

export function bindAllTableScrollers(root = document) {
  root.querySelectorAll('[data-scroll-hint]').forEach((wrap) => bindHorizontalScroller(wrap));
}
