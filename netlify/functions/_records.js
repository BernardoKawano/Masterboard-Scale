const { randomUUID } = require('node:crypto');

const STORE_NAME = 'scale-diagnostics';
const RECORD_PREFIX = 'leads/';
const DEAL_ACCEPTANCE_PRODUCTS = ['Scale', 'Masterboard Club', 'Combo Club + Scale'];
const DEAL_ACCEPTANCE_PAYMENT_OPTIONS = ['Cartão - à vista', 'Cartão - parcelado'];

const PIPELINE_STAGE_IDS = new Set([
  'prospeccao',
  'diagnostico_enviado',
  'reuniao_diagnostico',
  'negociacao',
  'assinado',
  'sem_fit',
]);

const STATUS_RANK = {
  captured: 1,
  started: 2,
  error: 2,
  completed: 3,
  deal_accepted: 4,
};

function timestamp(now = new Date()) {
  return now instanceof Date ? now.toISOString() : new Date(now).toISOString();
}

function cleanString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function cleanDigits(value) {
  return cleanString(value).replace(/\D/g, '');
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
  goiania: 'Goiânia',
  londrina: 'Londrina',
  maringa: 'Maringá',
  sao_paulo: 'São Paulo',
  sp: 'São Paulo',
};

const CITY_DEFAULT_STATES = {
  curitiba: 'PR',
  goiania: 'GO',
  londrina: 'PR',
  maringa: 'PR',
  sao_paulo: 'SP',
  sp: 'SP',
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

function inferStateForCity(value) {
  return CITY_DEFAULT_STATES[normalizeKey(value)] || '';
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
  const directCity = canonicalCity(cleaned);
  const directState = inferStateForCity(cleaned);
  if (directState) return `${directCity}, ${directState}`;

  const stateAlias = Object.keys(STATE_ALIASES)
    .sort((a, b) => b.length - a.length)
    .find((alias) => key.endsWith(`_${alias}`));

  if (stateAlias) {
    const cityKey = key.slice(0, -(stateAlias.length + 1)).replace(/_/g, ' ');
    return `${canonicalCity(cityKey)}, ${STATE_ALIASES[stateAlias]}`;
  }

  return directCity;
}

function createLeadId() {
  if (typeof randomUUID === 'function') return randomUUID();
  return `lead_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function createDealAcceptanceId() {
  if (typeof randomUUID === 'function') return `deal_${randomUUID()}`;
  return `deal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeChoice(value, choices = []) {
  const raw = cleanString(value);
  const match = choices.find((choice) => normalizeKey(choice) === normalizeKey(raw));
  return match || raw;
}

function normalizeFormData(formData = {}) {
  const codigoPais = cleanString(formData.codigo_pais || formData.codigoPais);
  const whatsapp = cleanString(formData.whatsapp);
  const telefone = cleanString(formData.telefone) || [codigoPais, whatsapp].filter(Boolean).join(' ');

  return {
    leadId: cleanString(formData.leadId || formData.id),
    intencao: cleanString(formData.intencao),
    source: cleanString(formData.source),
    nome: cleanString(formData.nome),
    email: cleanString(formData.email).toLowerCase(),
    codigo_pais: codigoPais,
    whatsapp,
    telefone,
    empresa: cleanString(formData.empresa),
    website: cleanString(formData.website),
    cargo: cleanString(formData.cargo),
    faturamento: cleanString(formData.faturamento),
    colaboradores: cleanString(formData.colaboradores),
    momento: cleanString(formData.momento),
    momento_label: cleanString(formData.momento_label || formData.momentoLabel),
    objetivo: cleanString(formData.objetivo),
    evento_interesse: cleanString(formData.evento_interesse || formData.eventoInteresse),
    lgpd: Boolean(formData.lgpd),
    localizacao: normalizeLocation(formData.localizacao),
  };
}

function normalizeDealAcceptanceData(formData = {}) {
  const codigoPais = cleanString(formData.codigo_pais || formData.codigoPais);
  const whatsapp = cleanString(formData.whatsapp);
  const telefone = cleanString(formData.telefone) || [codigoPais, whatsapp].filter(Boolean).join(' ');
  const documento = cleanString(formData.documento || formData.cnpj_cpf || formData.cpf_cnpj);
  const empresa = cleanString(formData.empresa || formData.razao_social || formData.razaoSocial);
  const razaoSocial = cleanString(formData.razao_social || formData.razaoSocial || empresa);

  return {
    leadId: cleanString(formData.leadId || formData.acceptanceId || formData.id),
    recordType: 'deal_acceptance',
    source: cleanString(formData.source) || 'aceite-page',
    nome: cleanString(formData.nome),
    email: cleanString(formData.email).toLowerCase(),
    codigo_pais: codigoPais,
    whatsapp,
    telefone,
    documento,
    documento_numero: cleanDigits(documento),
    empresa,
    razao_social: razaoSocial,
    nome_fantasia: cleanString(formData.nome_fantasia || formData.nomeFantasia),
    website: cleanString(formData.website),
    endereco: cleanString(formData.endereco),
    localizacao: normalizeLocation(formData.localizacao),
    produto: normalizeChoice(formData.produto, DEAL_ACCEPTANCE_PRODUCTS),
    forma_pagamento: normalizeChoice(
      formData.forma_pagamento || formData.formaPagamento,
      DEAL_ACCEPTANCE_PAYMENT_OPTIONS
    ),
    observacoes: cleanString(formData.observacoes),
    aceite: Boolean(formData.aceite || formData.acceptedTerms),
    lgpd: Boolean(formData.lgpd),
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

function createDealAcceptancePatch(formData = {}, now = new Date()) {
  const normalized = normalizeDealAcceptanceData(formData);
  const leadId = normalized.leadId || createDealAcceptanceId();
  const at = timestamp(now);

  return {
    leadId,
    recordType: 'deal_acceptance',
    status: 'deal_accepted',
    commercialStatus: 'sold',
    pipelineStage: 'assinado',
    pipelineStageAt: at,
    createdAt: at,
    updatedAt: at,
    acceptedAt: at,
    convertedAt: at,
    soldAt: at,
    lostAt: '',
    formData: { ...normalized, leadId },
    acceptanceData: { ...normalized, leadId },
    events: [{ type: 'deal_accepted', at }],
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

function createAdminPatch(leadId, action, options = {}) {
  const normalizedLeadId = cleanString(leadId);
  const now = options instanceof Date
    ? options
    : options.now instanceof Date
      ? options.now
      : new Date(options.now || Date.now());
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

  if (action === 'mark_converted' || action === 'mark_sold' || action === 'mark_won') {
    return {
      leadId: normalizedLeadId,
      updatedAt: at,
      commercialStatus: 'sold',
      convertedAt: at,
      soldAt: at,
      lostAt: '',
      pipelineStage: 'assinado',
      pipelineStageAt: at,
      events: [{ type: 'dashboard_marked_won', at }],
    };
  }

  if (action === 'mark_lost') {
    return {
      leadId: normalizedLeadId,
      updatedAt: at,
      commercialStatus: 'lost',
      convertedAt: '',
      soldAt: '',
      lostAt: at,
      pipelineStage: 'sem_fit',
      pipelineStageAt: at,
      events: [{ type: 'dashboard_marked_lost', at }],
    };
  }

  if (action === 'clear_commercial_status') {
    return {
      leadId: normalizedLeadId,
      updatedAt: at,
      commercialStatus: '',
      convertedAt: '',
      soldAt: '',
      lostAt: '',
      events: [{ type: 'dashboard_cleared_commercial_status', at }],
    };
  }

  if (action === 'set_pipeline_stage') {
    const stage = cleanString(options.stage);
    if (!PIPELINE_STAGE_IDS.has(stage)) {
      throw new Error('Estagio de pipeline invalido');
    }

    return {
      leadId: normalizedLeadId,
      updatedAt: at,
      pipelineStage: stage,
      pipelineStageAt: at,
      events: [{ type: 'dashboard_pipeline_stage_set', at, stage }],
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
    acceptedAt: patch.acceptedAt || existing.acceptedAt,
    convertedAt: nextConvertedAt,
    soldAt: Object.prototype.hasOwnProperty.call(patch, 'soldAt') ? patch.soldAt : existing.soldAt,
    lostAt: Object.prototype.hasOwnProperty.call(patch, 'lostAt') ? patch.lostAt : existing.lostAt,
    formData: mergeFormData(existing.formData, patch.formData),
    acceptanceData: patch.acceptanceData ? mergeFormData(existing.acceptanceData, patch.acceptanceData) : existing.acceptanceData,
    events: [...(existing.events || []), ...(patch.events || [])],
  };
}

function summarizeRecord(record) {
  const form = record.formData || {};
  const report = record.report || {};

  return {
    leadId: record.leadId,
    recordType: record.recordType || '',
    status: record.status,
    commercialStatus: record.commercialStatus || '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    completedAt: record.completedAt || '',
    acceptedAt: record.acceptedAt || '',
    convertedAt: record.convertedAt || '',
    soldAt: record.soldAt || '',
    lostAt: record.lostAt || '',
    deletedAt: record.deletedAt || '',
    pipelineStage: record.pipelineStage || '',
    pipelineStageAt: record.pipelineStageAt || '',
    nome: report.nome || form.nome || '',
    empresa: report.empresa || form.empresa || '',
    email: report.email || form.email || '',
    whatsapp: report.whatsapp || form.whatsapp || '',
    faturamento: report.faturamento || form.faturamento || '',
    localizacao: report.localizacao || form.localizacao || '',
    documento: form.documento || '',
    documento_numero: form.documento_numero || '',
    razao_social: form.razao_social || '',
    endereco: form.endereco || '',
    produto: form.produto || '',
    forma_pagamento: form.forma_pagamento || '',
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
  createDealAcceptancePatch,
  createAdminPatch,
  createDealAcceptanceId,
  createErrorPatch,
  createLeadId,
  createStartedPatch,
  ensureLeadId,
  getRecordKey,
  mergeRecord,
  normalizeDealAcceptanceData,
  normalizeFormData,
  normalizeLocation,
  sanitizeReport,
  summarizeRecord,
};
