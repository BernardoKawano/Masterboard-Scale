import { shouldShowScrollHint } from './dashboard-ui.mjs';
import { getTableScrollHintText, isCoarsePointer } from './dashboard-mobile.mjs';

export function canScrollHorizontally(scroller) {
  if (!scroller) return false;
  return scroller.scrollWidth > scroller.clientWidth + 1;
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
 * Scroll horizontal fluido: hint, sombra na coluna fixa, Shift+roda, arrastar.
 */
export function bindTableScroller(wrap) {
  const scroller = wrap?.querySelector?.('.table-scroll');
  if (!scroller || wrap.dataset.scrollBound === '1') return;

  wrap.dataset.scrollBound = '1';

  const update = () => updateTableScrollState(scroller, wrap);

  scroller.addEventListener('scroll', update, { passive: true });

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    const table = scroller.querySelector('table');
    if (table) observer.observe(table);
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
    if (event.target.closest('input, button, a, summary, select, textarea, label')) return;
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

export function bindAllTableScrollers(root = document) {
  root.querySelectorAll('[data-scroll-hint]').forEach((wrap) => bindTableScroller(wrap));
}
