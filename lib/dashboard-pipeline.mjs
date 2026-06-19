/** Estágios do pipeline comercial (funil de conversão). */

export const PIPELINE_STAGE_IDS = [
  'prospeccao',
  'diagnostico_enviado',
  'reuniao_diagnostico',
  'negociacao',
  'assinado',
  'sem_fit',
];

export const PIPELINE_STAGES = [
  { id: 'prospeccao', label: 'Prospecção', color: '#A855F7' },
  { id: 'diagnostico_enviado', label: 'Diagnóstico enviado', color: '#F59E0B' },
  { id: 'reuniao_diagnostico', label: 'Reunião de diagnóstico', color: '#60A5FA' },
  { id: 'negociacao', label: 'Negociação comercial', color: '#F472B6' },
  { id: 'assinado', label: 'Assinado / fechado', color: '#22C55E' },
  { id: 'sem_fit', label: 'Sem fit', color: '#9A9A9A', muted: true },
];

const STAGE_SET = new Set(PIPELINE_STAGE_IDS);

export function isValidPipelineStage(stage) {
  return STAGE_SET.has(stage);
}

export function getPipelineStageMeta(stageId) {
  return PIPELINE_STAGES.find((stage) => stage.id === stageId) || null;
}

function isDealAcceptanceRecord(record) {
  return record.recordType === 'deal_acceptance' || record.status === 'deal_accepted';
}

function isWonRecord(record) {
  return record.commercialStatus === 'sold' || record.commercialStatus === 'converted';
}

export function isClosedDeal(record) {
  return resolvePipelineStage(record) === 'assinado';
}

export function filterClosedDeals(records) {
  return filterRecordsByStage(records, 'assinado');
}

export function countClosedDeals(records) {
  return filterClosedDeals(records).length;
}

export function inferPipelineStage(record) {
  if (isDealAcceptanceRecord(record)) return 'assinado';
  if (isWonRecord(record)) return 'assinado';
  if (record.pipelineStage === 'sem_fit' || (record.commercialStatus === 'lost' && !record.pipelineStage)) {
    return 'sem_fit';
  }
  if (record.status === 'completed') return 'diagnostico_enviado';
  if (['captured', 'started', 'error'].includes(record.status)) return 'prospeccao';
  return 'prospeccao';
}

export function resolvePipelineStage(record) {
  const explicit = record.pipelineStage || '';
  if (isDealAcceptanceRecord(record) && explicit !== 'sem_fit') return 'assinado';
  if (isWonRecord(record)) return 'assinado';
  if (isValidPipelineStage(explicit)) return explicit;
  return inferPipelineStage(record);
}

export function isPipelineEligible(record) {
  return !record.deletedAt;
}

export function filterPipelineRecords(records) {
  return records.filter(isPipelineEligible);
}

export function countByStage(records) {
  const counts = Object.fromEntries(PIPELINE_STAGE_IDS.map((id) => [id, 0]));
  filterPipelineRecords(records).forEach((record) => {
    const stage = resolvePipelineStage(record);
    counts[stage] += 1;
  });
  return counts;
}

export function barWidth(count, max) {
  if (!count) return 0;
  const safeMax = Math.max(max, 1);
  return Math.max(7, (count / safeMax) * 100);
}

export function countActivePipelineLeads(records) {
  return filterPipelineRecords(records).filter((record) => resolvePipelineStage(record) !== 'sem_fit').length;
}

export function countLostCommercial(records) {
  return filterPipelineRecords(records).filter((record) => record.commercialStatus === 'lost').length;
}

export function conversionRate(records) {
  const eligible = filterPipelineRecords(records).filter((record) => resolvePipelineStage(record) !== 'sem_fit');
  const prospeccao = eligible.filter((record) => {
    const stage = resolvePipelineStage(record);
    return stage === 'prospeccao' || stage === 'diagnostico_enviado' || stage === 'reuniao_diagnostico' || stage === 'negociacao' || stage === 'assinado';
  }).length;
  const assinado = eligible.filter((record) => resolvePipelineStage(record) === 'assinado').length;
  if (!prospeccao) return 0;
  return Math.round((assinado / prospeccao) * 100);
}

export function filterRecordsByStage(records, stageId) {
  if (!isValidPipelineStage(stageId)) return [];
  return filterPipelineRecords(records).filter((record) => resolvePipelineStage(record) === stageId);
}
