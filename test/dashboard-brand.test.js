import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BRAND,
  assertPrintStylesReadable,
  getDashboardRootCss,
  getPrintDocumentStyles,
} from '../lib/dashboard-brand.mjs';

test('tokens alinhados ao brandbook Masterboard', () => {
  assert.equal(BRAND.gold, '#FBBE0A');
  assert.equal(BRAND.ink, '#0A0A0A');
  assert.equal(BRAND.paper, '#E8E8E8');
});

test('folha de impressão usa modo papel com texto ink', () => {
  const css = getPrintDocumentStyles();
  assert.match(css, /color:\s*var\(--print-ink\)/);
  assert.match(css, /background:\s*#fff/);
  assert.match(css, /print-color-adjust:\s*exact/);
  assert.doesNotMatch(css, /background:\s*#111/);
});

test('folha de impressão evita combinações de baixo contraste', () => {
  assert.equal(assertPrintStylesReadable(getPrintDocumentStyles()), true);
});

test('tema do dashboard referencia ink e gold do brandbook', () => {
  const css = getDashboardRootCss();
  assert.match(css, /--bg:\s*#0A0A0A/);
  assert.match(css, /--yellow:\s*#FBBE0A/);
  assert.match(css, /--text:\s*#F4F4F4/);
});
