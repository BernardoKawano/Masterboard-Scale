import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isTestLead } from '../scripts/purge-test-leads.mjs';

test('identifica leads E2E de teste pelo leadId e nome', () => {
  assert.equal(isTestLead({
    leadId: 'teste_e2e_archie_a_1781276278453',
    formData: { nome: 'Teste E2E A', empresa: 'Alpha SaaS Teste' },
    status: 'completed',
  }), true);

  assert.equal(isTestLead({
    leadId: 'd43afc1f-d9c8-4d0c-be08-52427eb81e5e',
    formData: { nome: 'Bruno de Medeiros Costa', empresa: 'Be Make', email: 'bruno@lojabemake.com.br' },
    status: 'completed',
  }), false);
});
