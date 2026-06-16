import {
  formatCountdownParts,
  getCountdownParts,
  getPageScrollProgress,
  shouldShowStickyCta,
} from './landingMotionCore.mjs';

type CountupElement = HTMLElement & {
  dataset: {
    start?: string;
    end?: string;
    suffix?: string;
    animated?: string;
  };
};

const reduceMotionQuery = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion() {
  return window.matchMedia(reduceMotionQuery).matches;
}

function updateCountdowns() {
  const countdowns = Array.from(document.querySelectorAll<HTMLElement>('[data-countdown]'));

  countdowns.forEach((countdown) => {
    const targetDate = countdown.dataset.countdown;
    if (!targetDate) return;

    const countdownData = getCountdownParts(targetDate);
    countdown.classList.toggle('is-urgent', countdownData.days <= 30 && countdownData.totalMinutes > 0);

    const parts = formatCountdownParts(countdownData);
    for (const [key, value] of Object.entries(parts)) {
      const node = countdown.querySelector<HTMLElement>(`[data-countdown-part="${key}"]`);
      if (!node || node.textContent === value) continue;

      node.textContent = value;
      if (!prefersReducedMotion()) {
        node.classList.remove('is-flipping');
        void node.offsetWidth;
        node.classList.add('is-flipping');
      }
    }
  });
}

function animateCountup(element: CountupElement) {
  if (element.dataset.animated === 'true') return;
  element.dataset.animated = 'true';

  const start = Number(element.dataset.start ?? 0);
  const end = Number(element.dataset.end ?? 0);
  const suffix = element.dataset.suffix ?? '';

  if (prefersReducedMotion()) {
    element.textContent = `${end}${suffix}`;
    return;
  }

  const duration = 1200;
  const startedAt = performance.now();

  function frame(now: number) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(start + (end - start) * eased);
    element.textContent = `${value}${suffix}`;

    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function setupReveals() {
  const revealItems = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  const countups = Array.from(document.querySelectorAll<CountupElement>('[data-countup]'));

  if (prefersReducedMotion()) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    countups.forEach(animateCountup);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target as HTMLElement;
        target.classList.add('is-visible');

        if (target.matches('[data-countup]')) {
          animateCountup(target as CountupElement);
        }

        observer.unobserve(target);
      });
    },
    { threshold: 0.22, rootMargin: '0px 0px -12% 0px' },
  );

  [...revealItems, ...countups].forEach((item) => observer.observe(item));
}

function setupSections() {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-thread-target]'));
  let activeSectionId = sections[0]?.id ?? '';

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const id = (entry.target as HTMLElement).id;
        activeSectionId = id;
        document.documentElement.dataset.activeSection = id;
        const activeIndex = sections.findIndex((section) => section.id === id);

        sections.forEach((section, sectionIndex) => {
          section.classList.toggle('is-active', section.id === id);
          section.classList.toggle('has-passed', sectionIndex < activeIndex);
        });

        targets.forEach((target) => {
          const isActive = target.dataset.threadTarget === id;
          target.classList.toggle('is-active', isActive);
          target.classList.toggle(
            'has-passed',
            sections.findIndex((section) => section.id === target.dataset.threadTarget) <= activeIndex,
          );
        });

        const node = document.querySelector<HTMLElement>(`[data-section-node="${id}"]`);
        if (node) {
          node.classList.remove('is-active');
          void node.offsetWidth;
          node.classList.add('is-active');
        }
      });
    },
    { threshold: 0.45, rootMargin: '-10% 0px -35% 0px' },
  );

  sections.forEach((section) => observer.observe(section));

  return () => activeSectionId;
}

function setupScrollState(getActiveSectionId: () => string) {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  const stickyCta = document.querySelector<HTMLElement>('[data-sticky-cta]');
  const hero = document.querySelector<HTMLElement>('#hero');
  const heroVisual = document.querySelector<HTMLElement>('[data-hero-visual]');
  let ticking = false;

  function update() {
    const progress = getPageScrollProgress(window.scrollY, window.innerHeight, document.documentElement.scrollHeight);
    const heroBottom = hero ? hero.offsetTop + hero.offsetHeight * 0.72 : 600;

    document.documentElement.style.setProperty('--scroll-progress', String(progress));
    header?.classList.toggle('is-shrunk', window.scrollY > 80);
    stickyCta?.classList.toggle(
      'is-visible',
      shouldShowStickyCta(window.scrollY, heroBottom, getActiveSectionId()),
    );

    if (heroVisual && !prefersReducedMotion()) {
      heroVisual.style.setProperty('--hero-parallax', `${window.scrollY * -0.15}px`);
    }

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  requestUpdate();
}

function setupFaq() {
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-faq-item]'));

  items.forEach((item) => {
    const button = item.querySelector<HTMLButtonElement>('[data-faq-button]');
    if (!button) return;

    button.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      items.forEach((other) => other.classList.remove('is-open'));
      item.classList.toggle('is-open', !isOpen);
      button.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}

function setupTilt() {
  if (prefersReducedMotion()) return;
  if (window.matchMedia('(hover: none)').matches) return;

  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-tilt]'));
  const MAX_DEG = 7;

  cards.forEach((card) => {
    let raf = 0;

    function onMove(event: PointerEvent) {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 2 * MAX_DEG;
      const rotateX = (0.5 - py) * 2 * MAX_DEG;

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transition = 'transform 90ms linear';
        card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px)`;
      });
    }

    function reset() {
      if (raf) cancelAnimationFrame(raf);
      card.style.transition = 'transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1)';
      card.style.transform = '';
    }

    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
  });
}

export function initLandingMotion() {
  setupReveals();
  const getActiveSectionId = setupSections();
  setupScrollState(getActiveSectionId);
  setupFaq();
  setupTilt();

  if (document.querySelector('[data-countdown]')) {
    updateCountdowns();
    window.setInterval(updateCountdowns, 60000);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initLandingMotion, { once: true });
}
