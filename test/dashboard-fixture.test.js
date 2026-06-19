import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDashboardFixturePayload, getDashboardFixtureRecords } from '../lib/dashboard-fixture.mjs';

test('fixture cobre estados principais do dashboard', () => {
  const records = getDashboardFixtureRecords();
  const statuses = new Set(records.map((record) => record.status));
  assert.ok(statuses.has('completed'));
  assert.ok(statuses.has('captured'));
  assert.ok(statuses.has('deal_accepted'));
  assert.ok(records.some((record) => record.pipelineStage === 'reuniao_diagnostico'));
  assert.ok(records.some((record) => record.pipelineStage === 'sem_fit'));
});

test('payload de fixture inclui metadados de listagem', () => {
  const payload = getDashboardFixturePayload();
  assert.equal(Array.isArray(payload.records), true);
  assert.equal(payload.records.length >= 4, true);
  assert.equal(typeof payload.generatedAt, 'string');
});
