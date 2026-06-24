import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clamp,
  formatCountdownParts,
  getCountdownParts,
  getPageScrollProgress,
  getRevealObserverOptions,
  isElementInRevealViewport,
  shouldShowStickyCta,
} from '../src/scripts/landingMotionCore.mjs';

test('clamp limits values to the provided range', () => {
  assert.equal(clamp(-1), 0);
  assert.equal(clamp(0.4), 0.4);
  assert.equal(clamp(3, 0, 2), 2);
});

test('getPageScrollProgress returns a normalized scroll ratio', () => {
  assert.equal(getPageScrollProgress(0, 800, 2400), 0);
  assert.equal(getPageScrollProgress(800, 800, 2400), 0.5);
  assert.equal(getPageScrollProgress(1800, 800, 2400), 1);
});

test('getCountdownParts returns days, hours and minutes until target', () => {
  const parts = getCountdownParts('2026-07-30T08:00:00-03:00', new Date('2026-07-28T06:30:00-03:00'));

  assert.equal(parts.days, 2);
  assert.equal(parts.hours, 1);
  assert.equal(parts.minutes, 30);
});

test('formatCountdownParts pads digits for the landing timer', () => {
  assert.deepEqual(formatCountdownParts({ days: 2, hours: 1, minutes: 5 }), {
    days: '02',
    hours: '01',
    minutes: '05',
  });
});

test('shouldShowStickyCta hides duplicate CTAs in offer and final FAQ sections', () => {
  assert.equal(shouldShowStickyCta(700, 600, 'diagnosis'), true);
  assert.equal(shouldShowStickyCta(700, 600, 'offer'), false);
  assert.equal(shouldShowStickyCta(700, 600, 'faq'), false);
  assert.equal(shouldShowStickyCta(300, 600, 'diagnosis'), false);
});

test('isElementInRevealViewport detects elements inside the viewport margin', () => {
  assert.equal(isElementInRevealViewport({ top: 120, bottom: 220 }, 800, 48), true);
  assert.equal(isElementInRevealViewport({ top: -20, bottom: 30 }, 800, 48), false);
  assert.equal(isElementInRevealViewport({ top: 760, bottom: 820 }, 800, 48), false);
});

test('getRevealObserverOptions is more permissive on coarse pointers', () => {
  const mobile = getRevealObserverOptions(true);
  const desktop = getRevealObserverOptions(false);

  assert.ok(mobile.threshold[0] <= desktop.threshold[0]);
  assert.ok(mobile.rootMargin.includes('-4%'));
  assert.ok(desktop.rootMargin.includes('-8%'));
});
