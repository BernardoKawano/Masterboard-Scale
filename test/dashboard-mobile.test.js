import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildAcceptanceMobileCardHtml,
  buildLeadMobileCardHtml,
  getTableScrollHintText,
} from '../lib/dashboard-mobile.mjs';

test('hint de scroll adapta texto para toque', () => {
  assert.match(getTableScrollHintText(true), /Deslize/);
  assert.match(getTableScrollHintText(false), /Shift/);
});

test('card mobile de lead inclui ações e checkbox', () => {
  const html = buildLeadMobileCardHtml({ leadId: 'lead_1' }, {
    name: 'Ana',
    subtitle: 'Empresa X',
    score: '72',
    pills: '<span class="pill">ok</span>',
    produto: 'Scale',
    pagamento: 'PIX',
    regiao: 'SP',
    chegada: '01/01/2026',
    selected: true,
  });
  assert.match(html, /data-check="lead_1" checked/);
  assert.match(html, /data-open="lead_1"/);
  assert.match(html, /data-admin="mark_won"/);
  assert.match(html, /Ana/);
});

test('card mobile de aceite inclui empresa e data', () => {
  const html = buildAcceptanceMobileCardHtml({ leadId: 'acc_1' }, {
    empresa: 'Empresa Y',
    responsavel: 'João',
    date: '10/01/2026',
    produto: 'Combo',
    pagamento: 'Cartão',
    regiao: 'RJ',
  });
  assert.match(html, /Empresa Y/);
  assert.match(html, /data-open="acc_1"/);
  assert.match(html, /10\/01\/2026/);
});
