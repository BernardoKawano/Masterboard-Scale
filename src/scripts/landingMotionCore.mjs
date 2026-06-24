export function clamp(value, min = 0, max = 1) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function getPageScrollProgress(scrollY, viewportHeight, documentHeight) {
  const maxScroll = Math.max(documentHeight - viewportHeight, 1);
  return clamp(scrollY / maxScroll);
}

export function getCountdownParts(targetDate, now = new Date()) {
  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const diff = Math.max(target.getTime() - now.getTime(), 0);
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes, totalMinutes };
}

export function formatCountdownParts(parts) {
  return {
    days: String(parts.days).padStart(2, '0'),
    hours: String(parts.hours).padStart(2, '0'),
    minutes: String(parts.minutes).padStart(2, '0'),
  };
}

export function shouldShowStickyCta(scrollY, heroBottom, activeSectionId) {
  const hiddenSections = new Set(['offer', 'faq']);
  return scrollY > heroBottom && !hiddenSections.has(activeSectionId);
}

export function isElementInRevealViewport(rect, viewportHeight, margin = 48) {
  return rect.bottom > margin && rect.top < viewportHeight - margin;
}

export function getRevealObserverOptions(isCoarsePointer = false) {
  if (isCoarsePointer) {
    return {
      threshold: [0, 0.08, 0.18],
      rootMargin: '0px 0px -4% 0px',
    };
  }

  return {
    threshold: [0, 0.12, 0.22],
    rootMargin: '0px 0px -8% 0px',
  };
}
