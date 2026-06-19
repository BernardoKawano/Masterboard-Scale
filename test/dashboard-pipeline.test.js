import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PIPELINE_STAGE_IDS,
  barWidth,
  conversionRate,
  countActivePipelineLeads,
  countByStage,
  countLostCommercial,
  inferPipelineStage,
  isValidPipelineStage,
  resolvePipelineStage,
} from '../lib/dashboard-pipeline.mjs';

test('lista de estágios inclui sem fit como sexto estágio', () => {
  assert.equal(PIPELINE_STAGE_IDS.length, 6);
  assert.equal(PIPELINE_STAGE_IDS.at(-1), 'sem_fit');
  assert.equal(isValidPipelineStage('sem_fit'), true);
  assert.equal(isValidPipelineStage('invalid'), false);
});

test('inferência automática cobre registros legados', () => {
  assert.equal(inferPipelineStage({ status: 'captured' }), 'prospeccao');
  assert.equal(inferPipelineStage({ status: 'started' }), 'prospeccao');
  assert.equal(inferPipelineStage({ status: 'completed' }), 'diagnostico_enviado');
  assert.equal(inferPipelineStage({ status: 'completed', commercialStatus: 'sold' }), 'assinado');
  assert.equal(inferPipelineStage({ status: 'deal_accepted', recordType: 'deal_acceptance' }), 'assinado');
});

test('override manual de pipelineStage tem prioridade', () => {
  const record = {
    status: 'completed',
    pipelineStage: 'reuniao_diagnostico',
  };
  assert.equal(resolvePipelineStage(record), 'reuniao_diagnostico');

  const semFit = {
    status: 'completed',
    commercialStatus: 'lost',
    pipelineStage: 'sem_fit',
  };
  assert.equal(resolvePipelineStage(semFit), 'sem_fit');
});

test('contagens por estágio ignoram registros excluídos', () => {
  const records = [
    { status: 'captured' },
    { status: 'captured' },
    { status: 'completed' },
    { status: 'completed', pipelineStage: 'reuniao_diagnostico' },
    { status: 'completed', commercialStatus: 'sold' },
    { status: 'completed', pipelineStage: 'sem_fit' },
    { status: 'completed', deletedAt: '2026-01-01T00:00:00.000Z' },
  ];

  const counts = countByStage(records);
  assert.equal(counts.prospeccao, 2);
  assert.equal(counts.diagnostico_enviado, 1);
  assert.equal(counts.reuniao_diagnostico, 1);
  assert.equal(counts.assinado, 1);
  assert.equal(counts.sem_fit, 1);
  assert.equal(counts.negociacao, 0);
});

test('métricas de conversão excluem sem fit', () => {
  const records = [
    { status: 'captured' },
    { status: 'captured' },
    { status: 'completed', commercialStatus: 'sold' },
    { status: 'completed', pipelineStage: 'sem_fit' },
    { status: 'completed', commercialStatus: 'lost' },
  ];

  assert.equal(countActivePipelineLeads(records), 4);
  assert.equal(countLostCommercial(records), 1);
  assert.equal(conversionRate(records), 25);
  assert.equal(barWidth(1, 3), 33.33333333333333);
  assert.equal(barWidth(0, 3), 0);
});
