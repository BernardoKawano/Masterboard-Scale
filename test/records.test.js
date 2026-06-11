const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createCapturedPatch,
  createCompletedPatch,
  createStartedPatch,
  getRecordKey,
  mergeRecord,
  normalizeFormData,
  summarizeRecord,
} = require('../netlify/functions/_records');

const formData = {
  leadId: 'lead_abc123',
  nome: ' Ana Founder ',
  email: 'ANA@EXAMPLE.COM ',
  whatsapp: '(11) 99999-9999',
  faturamento: 'R$1M-R$5M/ano',
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
});

test('gera chave previsivel para Netlify Blobs', () => {
  assert.equal(getRecordKey('lead_abc123'), 'leads/lead_abc123.json');
  assert.equal(getRecordKey('lead/abc 123'), 'leads/lead_abc_123.json');
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
    createdAt: undefined,
    updatedAt: '2026-06-11T12:08:00.000Z',
    completedAt: '2026-06-11T12:08:00.000Z',
    nome: 'Ana Founder',
    empresa: 'Empresa Alpha',
    email: 'ana@example.com',
    whatsapp: '(11) 99999-9999',
    faturamento: 'R$1M-R$5M/ano',
    localizacao: 'Sao Paulo - SP',
    score_geral: 42,
    nivel: 'Em Desenvolvimento',
    gargalo_critico: 'Aquisicao depende de relacionamento direto.',
  });
});
