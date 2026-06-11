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

const STATE_ALIASES = {
  ac: 'AC',
  acre: 'AC',
  al: 'AL',
  alagoas: 'AL',
  ap: 'AP',
  amapa: 'AP',
  am: 'AM',
  amazonas: 'AM',
  ba: 'BA',
  bahia: 'BA',
  ce: 'CE',
  ceara: 'CE',
  df: 'DF',
  distrito_federal: 'DF',
  es: 'ES',
  espirito_santo: 'ES',
  go: 'GO',
  goias: 'GO',
  ma: 'MA',
  maranhao: 'MA',
  mt: 'MT',
  mato_grosso: 'MT',
  ms: 'MS',
  mato_grosso_do_sul: 'MS',
  mg: 'MG',
  minas_gerais: 'MG',
  pa: 'PA',
  para: 'PA',
  pb: 'PB',
  paraiba: 'PB',
  pr: 'PR',
  parana: 'PR',
  pe: 'PE',
  pernambuco: 'PE',
  pi: 'PI',
  piaui: 'PI',
  rj: 'RJ',
  rio_de_janeiro: 'RJ',
  rn: 'RN',
  rio_grande_do_norte: 'RN',
  rs: 'RS',
  rio_grande_do_sul: 'RS',
  ro: 'RO',
  rondonia: 'RO',
  rr: 'RR',
  roraima: 'RR',
  sc: 'SC',
  santa_catarina: 'SC',
  sp: 'SP',
  sao_paulo: 'SP',
  se: 'SE',
  sergipe: 'SE',
  to: 'TO',
  tocantins: 'TO',
};

const CITY_ALIASES = {
  curitiba: 'Curitiba',
  maringa: 'Maringá',
  sao_paulo: 'São Paulo',
};

function normalizeKey(value) {
  return cleanString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function titleCaseCity(value) {
  const connectors = new Set(['da', 'de', 'di', 'do', 'das', 'dos', 'e']);
  return cleanString(value)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => (index > 0 && connectors.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

function normalizeState(value) {
  return STATE_ALIASES[normalizeKey(value)] || '';
}

function canonicalCity(value) {
  const cleaned = cleanString(value).replace(/\s+/g, ' ');
  return CITY_ALIASES[normalizeKey(cleaned)] || titleCaseCity(cleaned);
}

function normalizeLocation(value) {
  const raw = cleanString(value);
  if (!raw) return '';

  const cleaned = raw
    .replace(/[–—-]/g, ',')
    .replace(/\s*\/\s*/g, ',')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = cleaned.split(',').map((part) => part.trim()).filter(Boolean);

  if (parts.length >= 2) {
    const state = normalizeState(parts.at(-1));
    const city = canonicalCity(parts.slice(0, -1).join(' '));
    return state ? `${city}, ${state}` : canonicalCity(cleaned);
  }

  const key = normalizeKey(cleaned);
  const stateAlias = Object.keys(STATE_ALIASES)
    .sort((a, b) => b.length - a.length)
    .find((alias) => key.endsWith(`_${alias}`));

  if (stateAlias) {
    const cityKey = key.slice(0, -(stateAlias.length + 1)).replace(/_/g, ' ');
    return `${canonicalCity(cityKey)}, ${STATE_ALIASES[stateAlias]}`;
  }

  return canonicalCity(cleaned);
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
    localizacao: normalizeLocation(formData.localizacao),
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
    localizacao: normalizeLocation(clientReport.localizacao),
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

function createAdminPatch(leadId, action, now = new Date()) {
  const normalizedLeadId = cleanString(leadId);
  const at = timestamp(now);

  if (!normalizedLeadId) throw new Error('leadId ausente para acao administrativa');

  if (action === 'delete') {
    return {
      leadId: normalizedLeadId,
      updatedAt: at,
      deletedAt: at,
      events: [{ type: 'dashboard_deleted', at }],
    };
  }

  if (action === 'restore') {
    return {
      leadId: normalizedLeadId,
      updatedAt: at,
      deletedAt: '',
      events: [{ type: 'dashboard_restored', at }],
    };
  }

  if (action === 'mark_converted') {
    return {
      leadId: normalizedLeadId,
      updatedAt: at,
      commercialStatus: 'converted',
      convertedAt: at,
      soldAt: '',
      events: [{ type: 'dashboard_marked_converted', at }],
    };
  }

  if (action === 'mark_sold') {
    return {
      leadId: normalizedLeadId,
      updatedAt: at,
      commercialStatus: 'sold',
      convertedAt: at,
      soldAt: at,
      events: [{ type: 'dashboard_marked_sold', at }],
    };
  }

  if (action === 'clear_commercial_status') {
    return {
      leadId: normalizedLeadId,
      updatedAt: at,
      commercialStatus: '',
      convertedAt: '',
      soldAt: '',
      events: [{ type: 'dashboard_cleared_commercial_status', at }],
    };
  }

  throw new Error('Acao administrativa invalida');
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
  const patchHasConvertedAt = Object.prototype.hasOwnProperty.call(patch, 'convertedAt');
  const nextConvertedAt = patch.commercialStatus === 'sold'
    ? existing.convertedAt || patch.convertedAt || patch.updatedAt
    : patchHasConvertedAt
      ? patch.convertedAt
      : existing.convertedAt;

  return {
    ...existing,
    ...patch,
    status: nextStatus,
    createdAt: existing.createdAt || patch.createdAt || patch.updatedAt || timestamp(),
    updatedAt: patch.updatedAt || timestamp(),
    completedAt: patch.completedAt || existing.completedAt,
    convertedAt: nextConvertedAt,
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
    commercialStatus: record.commercialStatus || '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    completedAt: record.completedAt || '',
    convertedAt: record.convertedAt || '',
    soldAt: record.soldAt || '',
    deletedAt: record.deletedAt || '',
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
  createAdminPatch,
  createErrorPatch,
  createLeadId,
  createStartedPatch,
  ensureLeadId,
  getRecordKey,
  mergeRecord,
  normalizeFormData,
  normalizeLocation,
  sanitizeReport,
  summarizeRecord,
};
