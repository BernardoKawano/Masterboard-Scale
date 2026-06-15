const assert = require('node:assert/strict');
const test = require('node:test');

const {
  dealAcceptanceRecipients,
  parseRecipientList,
  validateAcceptance,
} = require('../netlify/functions/deal-acceptance');
const { normalizeDealAcceptanceData } = require('../netlify/functions/_records');

const validPayload = {
  leadId: 'deal_test',
  source: 'aceite-page',
  nome: 'Maria Silva',
  email: 'MARIA@EMPRESA.COM',
  documento: '12.345.678/0001-99',
  codigo_pais: '+55',
  whatsapp: '(11) 99999-9999',
  telefone: '+55 (11) 99999-9999',
  empresa: 'Empresa Real',
  razao_social: 'Empresa Real LTDA',
  website: 'https://empresa.com.br',
  localizacao: 'Sao Paulo, SP',
  endereco: 'Rua Exemplo, 123',
  produto: 'Combo Club + Scale',
  forma_pagamento: 'Cartao - parcelado',
  aceite: true,
  lgpd: true,
  _gotcha: '',
};

test('normalizeDealAcceptanceData accepts Combo Club + Scale', () => {
  const normalized = normalizeDealAcceptanceData(validPayload);

  assert.equal(normalized.produto, 'Combo Club + Scale');
  assert.equal(normalized.email, 'maria@empresa.com');
});

test('validateAcceptance accepts all required combo fields', () => {
  const normalized = normalizeDealAcceptanceData(validPayload);

  assert.deepEqual(validateAcceptance(normalized), []);
});

test('validateAcceptance rejects arbitrary product and payment values', () => {
  const invalidProduct = normalizeDealAcceptanceData({ ...validPayload, produto: 'Produto inventado' });
  const invalidPayment = normalizeDealAcceptanceData({ ...validPayload, forma_pagamento: 'Boleto' });

  assert.deepEqual(validateAcceptance(invalidProduct), ['produto']);
  assert.deepEqual(validateAcceptance(invalidPayment), ['forma_pagamento']);
});

test('parseRecipientList splits comma, semicolon and whitespace separated recipients', () => {
  assert.deepEqual(parseRecipientList('a@test.com, b@test.com; c@test.com\nd@test.com'), [
    'a@test.com',
    'b@test.com',
    'c@test.com',
    'd@test.com',
  ]);
});

test('dealAcceptanceRecipients uses env override when present', () => {
  const previousRecipients = process.env.DEAL_ACCEPTANCE_RECIPIENTS;
  process.env.DEAL_ACCEPTANCE_RECIPIENTS = 'sales@test.com ops@test.com';

  try {
    assert.deepEqual(dealAcceptanceRecipients(), ['sales@test.com', 'ops@test.com']);
  } finally {
    if (previousRecipients) {
      process.env.DEAL_ACCEPTANCE_RECIPIENTS = previousRecipients;
    } else {
      delete process.env.DEAL_ACCEPTANCE_RECIPIENTS;
    }
  }
});
