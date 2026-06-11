const { randomUUID } = require('node:crypto');

const STORE_NAME = 'scale-diagnostics';
const RECORD_PREFIX = 'leads/';

const STATUS_RANK = {
  captured: 1,
  started: 2,
  error: 2,
  completed: 3,
};

function timestamp(now = new Date()) {
  return now instanceof Date ? now.toISOString() : new Date(now).toISOString();
}

function cleanString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function createLeadId() {
  if (typeof randomUUID === 'function') return randomUUID();
  return `lead_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeFormData(formData = {}) {
  return {
    leadId: cleanString(formData.leadId || formData.id),
    nome: cleanString(formData.nome),
    email: cleanString(formData.email).toLowerCase(),
    whatsapp: cleanString(formData.whatsapp),
    faturamento: cleanString(formData.faturamento),
    localizacao: cleanString(formData.localizacao),
  };
}

function ensureLeadId(formData = {}) {
  const normalized = normalizeFormData(formData);
  return normalized.leadId || createLeadId();
}

function getRecordKey(leadId) {
  const safeLeadId = cleanString(leadId).replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!safeLeadId) throw new Error('leadId ausente para persistencia');
  return `${RECORD_PREFIX}${safeLeadId}.json`;
}

function compactMessages(messages = []) {
  return Array.isArray(messages)
    ? messages
        .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
        .map((message) => ({
          role: message.role,
          content: cleanString(message.content),
        }))
        .filter((message) => message.content && !message.content.startsWith('[DADOS DO FORMULÁRIO'))
    : [];
}

function buildConversation(messages = []) {
  return compactMessages(messages)
    .map((message) => `${message.role === 'user' ? 'Lead' : 'Archie'}: ${message.content}`)
    .join('\n\n');
}

function buildAnswers(messages = []) {
  return compactMessages(messages)
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join('\n\n');
}

function sanitizeReport(report = {}) {
  const { conversation, answers, ...clientReport } = report || {};
  return {
    ...clientReport,
    nome: cleanString(clientReport.nome),
    empresa: cleanString(clientReport.empresa),
    email: cleanString(clientReport.email).toLowerCase(),
    whatsapp: cleanString(clientReport.whatsapp),
    faturamento: cleanString(clientReport.faturamento),
    localizacao: cleanString(clientReport.localizacao),
    score_geral: Number(clientReport.score_geral ?? 0),
    nivel: cleanString(clientReport.nivel),
    dimensoes: clientReport.dimensoes || {},
    prioridades: Array.isArray(clientReport.prioridades) ? clientReport.prioridades : [],
    masterboard_tabela: Array.isArray(clientReport.masterboard_tabela) ? clientReport.masterboard_tabela : [],
  };
}

function createCapturedPatch(formData = {}, now = new Date()) {
  const normalized = normalizeFormData(formData);
  const leadId = normalized.leadId || createLeadId();
  return {
    leadId,
    status: 'captured',
    createdAt: timestamp(now),
    updatedAt: timestamp(now),
    formData: { ...normalized, leadId },
    events: [{ type: 'lead_captured', at: timestamp(now) }],
  };
}

function createStartedPatch(formData = {}, messages = [], now = new Date()) {
  const normalized = normalizeFormData(formData);
  const leadId = normalized.leadId || createLeadId();
  return {
    leadId,
    status: 'started',
    updatedAt: timestamp(now),
    formData: { ...normalized, leadId },
    messageCount: compactMessages(messages).length,
    events: [{ type: 'diagnostic_started', at: timestamp(now) }],
  };
}

function createCompletedPatch(formData = {}, report = {}, messages = [], now = new Date()) {
  const normalized = normalizeFormData(formData);
  const leadId = normalized.leadId || createLeadId();
  const conversation = cleanString(report.conversation) || buildConversation(messages);
  const answers = cleanString(report.answers) || buildAnswers(messages);
  const cleanReport = sanitizeReport(report);

  return {
    leadId,
    status: 'completed',
    updatedAt: timestamp(now),
    completedAt: timestamp(now),
    formData: {
      ...normalized,
      leadId,
      nome: cleanReport.nome || normalized.nome,
      email: cleanReport.email || normalized.email,
      whatsapp: cleanReport.whatsapp || normalized.whatsapp,
      faturamento: cleanReport.faturamento || normalized.faturamento,
      localizacao: cleanReport.localizacao || normalized.localizacao,
    },
    report: cleanReport,
    conversation,
    answers,
    messageCount: compactMessages(messages).length,
    events: [{ type: 'diagnostic_completed', at: timestamp(now) }],
  };
}

function createErrorPatch(formData = {}, error, now = new Date()) {
  const normalized = normalizeFormData(formData);
  const leadId = normalized.leadId || createLeadId();
  return {
    leadId,
    status: 'error',
    updatedAt: timestamp(now),
    formData: { ...normalized, leadId },
    error: cleanString(error && error.message ? error.message : error),
    events: [{ type: 'diagnostic_error', at: timestamp(now) }],
  };
}

function mergeFormData(existing = {}, incoming = {}) {
  const merged = { ...existing };
  Object.entries(incoming || {}).forEach(([key, value]) => {
    const cleaned = cleanString(value);
    if (cleaned) merged[key] = cleaned;
  });
  return merged;
}

function mergeRecord(existing, patch) {
  if (!existing) {
    return {
      ...patch,
      createdAt: patch.createdAt || patch.updatedAt || timestamp(),
      updatedAt: patch.updatedAt || timestamp(),
      events: patch.events || [],
    };
  }

  const existingRank = STATUS_RANK[existing.status] || 0;
  const patchRank = STATUS_RANK[patch.status] || 0;
  const nextStatus = patchRank >= existingRank ? patch.status : existing.status;

  return {
    ...existing,
    ...patch,
    status: nextStatus,
    createdAt: existing.createdAt || patch.createdAt || patch.updatedAt || timestamp(),
    updatedAt: patch.updatedAt || timestamp(),
    completedAt: patch.completedAt || existing.completedAt,
    formData: mergeFormData(existing.formData, patch.formData),
    events: [...(existing.events || []), ...(patch.events || [])],
  };
}

function summarizeRecord(record) {
  const form = record.formData || {};
  const report = record.report || {};

  return {
    leadId: record.leadId,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    completedAt: record.completedAt || '',
    nome: report.nome || form.nome || '',
    empresa: report.empresa || '',
    email: report.email || form.email || '',
    whatsapp: report.whatsapp || form.whatsapp || '',
    faturamento: report.faturamento || form.faturamento || '',
    localizacao: report.localizacao || form.localizacao || '',
    score_geral: Number(report.score_geral || 0),
    nivel: report.nivel || '',
    gargalo_critico: report.gargalo_critico || '',
  };
}

module.exports = {
  STORE_NAME,
  RECORD_PREFIX,
  buildAnswers,
  buildConversation,
  cleanString,
  compactMessages,
  createCapturedPatch,
  createCompletedPatch,
  createErrorPatch,
  createLeadId,
  createStartedPatch,
  ensureLeadId,
  getRecordKey,
  mergeRecord,
  normalizeFormData,
  sanitizeReport,
  summarizeRecord,
};
