/** Helpers de UI reutilizáveis no dashboard. */
export function buildEmptyStateHtml(message, ctaLabel = '', action = '') {
  const text = `<p class="empty-state-copy">${escapeAttr(message)}</p>`;
  if (!ctaLabel) return `<div class="empty-state">${text}</div>`;
  if (action === 'clear') {
    return `<div class="empty-state">${text}<button class="icon" data-empty-action="clear" type="button">${escapeAttr(ctaLabel)}</button></div>`;
  }
  if (action) {
    return `<div class="empty-state">${text}<button class="icon" data-empty-view="${escapeAttr(action)}" type="button">${escapeAttr(ctaLabel)}</button></div>`;
  }
  return `<div class="empty-state">${text}</div>`;
}

export function hasActiveDashboardFilters(filters) {
  return Boolean(
    filters.query
    || filters.status !== 'all'
    || filters.score !== 'all'
    || filters.date !== 'all'
    || filters.region
    || filters.revenue !== 'all',
  );
}

export function shouldShowScrollHint(scrollWidth, clientWidth, scrollLeft) {
  const canScroll = scrollWidth > clientWidth + 8;
  const atEnd = scrollLeft + clientWidth >= scrollWidth - 8;
  return canScroll && !atEnd;
}

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
