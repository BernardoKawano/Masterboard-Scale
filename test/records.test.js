const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createAdminPatch,
  createCapturedPatch,
  createCompletedPatch,
  createStartedPatch,
  getRecordKey,
  mergeRecord,
  normalizeFormData,
  normalizeLocation,
  summarizeRecord,
} = require('../netlify/functions/_records');

const formData = {
  leadId: 'lead_abc123',
  nome: ' Ana Founder ',
  email: 'ANA@EXAMPLE.COM ',
  intencao: 'membro',
  source: 'candidatura-page',
  codigo_pais: '+55',
  whatsapp: '(11) 99999-9999',
  telefone: '+55 (11) 99999-9999',
  empresa: 'Empresa Alpha',
  website: 'https://empresa-alpha.com.br',
  cargo: 'Sócio ou Fundador',
  faturamento: 'R$1M-R$5M/ano',
  colaboradores: 'De 51 a 100 colaboradores',
  lgpd: true,
  localizacao: 'Sao Paulo - SP',
};

const messages = [
  { role: 'user', content: 'ola' },
  { role: 'assistant', content: 'Qual e o nome da empresa?' },
  { role: 'user', content: 'Empresa Alpha, vende software B2B e ticket medio de R$ 20 mil.' },
  { role: 'assistant', content: 'Voce consegue descrever em uma frase quem e seu cliente ideal?' },
  { role: 'user', content: 'Diretores comerciais de empresas B2B entre R$5M e R$50M.' },
];

const report = {
  tipo: 'relatorio',
  nome: 'Ana Founder',
  empresa: 'Empresa Alpha',
  email: 'ana@example.com',
  whatsapp: '(11) 99999-9999',
  faturamento: 'R$1M-R$5M/ano',
  localizacao: 'Sao Paulo - SP',
  score_geral: 42,
  nivel: 'Em Desenvolvimento',
  dimensoes: {
    S: { score: 40, status: 'ICP ainda informal', gargalo: 'Nao ha criterios documentados' },
    C: { score: 35, status: 'Canal dependente de indicacao', gargalo: 'Sem aquisicao previsivel' },
  },
  gargalo_critico: 'Aquisicao depende de relacionamento direto.',
  prioridades: ['Documentar ICP', 'Criar cadencia semanal de pipeline'],
  parecer: 'A operacao tem tracao, mas ainda depende de pessoas-chave.',
  setor_insights: 'Empresas B2B desse porte costumam confundir indicacao com canal escalavel.',
  ecossistema_match: 'Conexoes com decisores B2B em Sao Paulo podem acelerar o ciclo.',
  masterboard_tabela: [
    { desafio: 'Pipeline irregular', impacto: 'Forecast fraco', conexao: 'Parceiros de demanda' },
  ],
};

test('normaliza dados do formulario', () => {
  const normalized = normalizeFormData(formData);

  assert.equal(normalized.leadId, 'lead_abc123');
  assert.equal(normalized.nome, 'Ana Founder');
  assert.equal(normalized.email, 'ana@example.com');
  assert.equal(normalized.whatsapp, '(11) 99999-9999');
  assert.equal(normalized.telefone, '+55 (11) 99999-9999');
  assert.equal(normalized.empresa, 'Empresa Alpha');
  assert.equal(normalized.cargo, 'Sócio ou Fundador');
  assert.equal(normalized.colaboradores, 'De 51 a 100 colaboradores');
  assert.equal(normalized.lgpd, true);
  assert.equal(normalized.localizacao, 'São Paulo, SP');
});

test('preserva campos da candidatura na captura', () => {
  const captured = createCapturedPatch(formData, new Date('2026-06-11T12:00:00.000Z'));

  assert.equal(captured.formData.intencao, 'membro');
  assert.equal(captured.formData.source, 'candidatura-page');
  assert.equal(captured.formData.empresa, 'Empresa Alpha');
  assert.equal(captured.formData.website, 'https://empresa-alpha.com.br');
  assert.equal(captured.formData.cargo, 'Sócio ou Fundador');
  assert.equal(captured.formData.telefone, '+55 (11) 99999-9999');
  assert.equal(captured.formData.lgpd, true);
});

test('gera chave previsivel para Netlify Blobs', () => {
  assert.equal(getRecordKey('lead_abc123'), 'leads/lead_abc123.json');
  assert.equal(getRecordKey('lead/abc 123'), 'leads/lead_abc_123.json');
});

test('normaliza variacoes de cidade e estado para agrupamento', () => {
  assert.equal(normalizeLocation('Maringá, PR'), 'Maringá, PR');
  assert.equal(normalizeLocation('Maringá / PR'), 'Maringá, PR');
  assert.equal(normalizeLocation('Maringá/PR'), 'Maringá, PR');
  assert.equal(normalizeLocation('Curitiba PR'), 'Curitiba, PR');
  assert.equal(normalizeLocation('Curitiba, Paraná'), 'Curitiba, PR');
  assert.equal(normalizeLocation('Maringá'), 'Maringá, PR');
  assert.equal(normalizeLocation('Curitiba'), 'Curitiba, PR');
  assert.equal(normalizeLocation('Londrina'), 'Londrina, PR');
  assert.equal(normalizeLocation('Goiânia'), 'Goiânia, GO');
  assert.equal(normalizeLocation('São Paulo'), 'São Paulo, SP');
  assert.equal(normalizeLocation('Sp'), 'São Paulo, SP');
});

test('mescla captura, inicio e conclusao sem perder createdAt', () => {
  const captured = createCapturedPatch(formData, new Date('2026-06-11T12:00:00.000Z'));
  const started = createStartedPatch(formData, messages.slice(0, 1), new Date('2026-06-11T12:01:00.000Z'));
  const completed = createCompletedPatch(formData, report, messages, new Date('2026-06-11T12:08:00.000Z'));

  const startedRecord = mergeRecord(captured, started);
  const completedRecord = mergeRecord(startedRecord, completed);

  assert.equal(completedRecord.status, 'completed');
  assert.equal(completedRecord.createdAt, '2026-06-11T12:00:00.000Z');
  assert.equal(completedRecord.completedAt, '2026-06-11T12:08:00.000Z');
  assert.equal(completedRecord.formData.email, 'ana@example.com');
  assert.equal(completedRecord.report.empresa, 'Empresa Alpha');
  assert.match(completedRecord.conversation, /Lead: Empresa Alpha/);
  assert.match(completedRecord.answers, /Diretores comerciais/);
  assert.equal(completedRecord.events.length, 3);
});

test('captura atrasada nao rebaixa diagnostico concluido', () => {
  const completed = createCompletedPatch(formData, report, messages, new Date('2026-06-11T12:08:00.000Z'));
  const captured = createCapturedPatch(formData, new Date('2026-06-11T12:09:00.000Z'));

  const record = mergeRecord(completed, captured);

  assert.equal(record.status, 'completed');
  assert.equal(record.report.empresa, 'Empresa Alpha');
});

test('resume registro para listagem do dashboard', () => {
  const record = createCompletedPatch(formData, report, messages, new Date('2026-06-11T12:08:00.000Z'));
  const summary = summarizeRecord(record);

  assert.deepEqual(summary, {
    leadId: 'lead_abc123',
    status: 'completed',
    commercialStatus: '',
    createdAt: undefined,
    updatedAt: '2026-06-11T12:08:00.000Z',
    completedAt: '2026-06-11T12:08:00.000Z',
    convertedAt: '',
    soldAt: '',
    lostAt: '',
    deletedAt: '',
    nome: 'Ana Founder',
    empresa: 'Empresa Alpha',
    email: 'ana@example.com',
    whatsapp: '(11) 99999-9999',
    faturamento: 'R$1M-R$5M/ano',
    localizacao: 'São Paulo, SP',
    score_geral: 42,
    nivel: 'Em Desenvolvimento',
    gargalo_critico: 'Aquisicao depende de relacionamento direto.',
  });
});

test('acoes administrativas preservam diagnostico e registram status comercial', () => {
  const completed = createCompletedPatch(formData, report, messages, new Date('2026-06-11T12:08:00.000Z'));
  const won = createAdminPatch('lead_abc123', 'mark_won', new Date('2026-06-11T12:10:00.000Z'));
  const lost = createAdminPatch('lead_abc123', 'mark_lost', new Date('2026-06-11T12:12:00.000Z'));
  const deleted = createAdminPatch('lead_abc123', 'delete', new Date('2026-06-11T12:14:00.000Z'));

  const wonRecord = mergeRecord(completed, won);
  const lostRecord = mergeRecord(wonRecord, lost);
  const deletedRecord = mergeRecord(lostRecord, deleted);

  assert.equal(deletedRecord.status, 'completed');
  assert.equal(deletedRecord.report.empresa, 'Empresa Alpha');
  assert.equal(wonRecord.commercialStatus, 'sold');
  assert.equal(wonRecord.convertedAt, '2026-06-11T12:10:00.000Z');
  assert.equal(wonRecord.soldAt, '2026-06-11T12:10:00.000Z');
  assert.equal(deletedRecord.commercialStatus, 'lost');
  assert.equal(deletedRecord.convertedAt, '');
  assert.equal(deletedRecord.soldAt, '');
  assert.equal(deletedRecord.lostAt, '2026-06-11T12:12:00.000Z');
  assert.equal(deletedRecord.deletedAt, '2026-06-11T12:14:00.000Z');
  assert.equal(deletedRecord.events.at(-1).type, 'dashboard_deleted');
});

test('acoes antigas de convertido e vendido continuam significando ganho', () => {
  const completed = createCompletedPatch(formData, report, messages, new Date('2026-06-11T12:08:00.000Z'));
  const converted = createAdminPatch('lead_abc123', 'mark_converted', new Date('2026-06-11T12:10:00.000Z'));
  const sold = createAdminPatch('lead_abc123', 'mark_sold', new Date('2026-06-11T12:12:00.000Z'));

  const convertedRecord = mergeRecord(completed, converted);
  const soldRecord = mergeRecord(convertedRecord, sold);

  assert.equal(convertedRecord.commercialStatus, 'sold');
  assert.equal(convertedRecord.soldAt, '2026-06-11T12:10:00.000Z');
  assert.equal(soldRecord.commercialStatus, 'sold');
  assert.equal(soldRecord.convertedAt, '2026-06-11T12:10:00.000Z');
  assert.equal(soldRecord.soldAt, '2026-06-11T12:12:00.000Z');
});
