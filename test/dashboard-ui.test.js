import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildEmptyStateHtml,
  buildFilterBannerHtml,
  hasActiveDashboardFilters,
  shouldShowScrollHint,
} from '../lib/dashboard-ui.mjs';
import { createPreviewBlobUrl, revokePreviewBlobUrl } from '../lib/dashboard-preview.mjs';

test('cria blob URL para prévia HTML', () => {
  const url = createPreviewBlobUrl('<!doctype html><title>x</title><p>ok</p>');
  assert.match(url, /^blob:/);
  revokePreviewBlobUrl(url);
});

test('empty state inclui CTA quando informado', () => {
  const html = buildEmptyStateHtml('Sem dados', 'Ir para Leads', 'leads');
  assert.match(html, /Sem dados/);
  assert.match(html, /data-empty-view="leads"/);
  assert.match(html, /Ir para Leads/);
});

test('banner de filtros ativos inclui limpar', () => {
  const html = buildFilterBannerHtml();
  assert.match(html, /Filtros da aba Leads/);
  assert.match(html, /data-empty-action="clear"/);
});

test('detecta filtros ativos no dashboard', () => {
  assert.equal(hasActiveDashboardFilters({
    query: '',
    status: 'all',
    score: 'all',
    date: 'all',
    region: '',
    revenue: 'all',
  }), false);
  assert.equal(hasActiveDashboardFilters({
    query: 'ana',
    status: 'all',
    score: 'all',
    date: 'all',
    region: '',
    revenue: 'all',
  }), true);
});

test('scroll hint some quando usuário chega ao fim da tabela', () => {
  assert.equal(shouldShowScrollHint(1200, 800, 0), true);
  assert.equal(shouldShowScrollHint(1200, 800, 400), false);
  assert.equal(shouldShowScrollHint(700, 800, 0), false);
});
