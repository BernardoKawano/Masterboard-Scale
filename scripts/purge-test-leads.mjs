/**
 * Remove leads de teste do dashboard (soft delete via PATCH).
 * Uso: DASHBOARD_TOKEN=... node scripts/purge-test-leads.mjs [--dry-run]
 */
import { pathToFileURL } from 'node:url';
import { getDashboardFixtureRecords } from '../lib/dashboard-fixture.mjs';

const API_BASE = process.env.DASHBOARD_API_BASE || 'https://masterboard.scaleco.ai';
const TOKEN = process.env.DASHBOARD_TOKEN || '';
const dryRun = process.argv.includes('--dry-run');

const FIXTURE_LEAD_IDS = new Set(getDashboardFixtureRecords().map((record) => record.leadId));

const TEST_EMAIL_DOMAINS = ['@example.com', '@example.org', '@test.com', '@mailinator.com'];
const TEST_LEAD_ID_PREFIXES = ['fixture_', 'demo-', 'teste_e2e_', 'teste_'];
const TEST_LEAD_IDS = new Set(['demo-chat']);

function clean(value) {
  return String(value || '').trim();
}

function recordEmail(record) {
  return clean(record.formData?.email || record.report?.email).toLowerCase();
}

function recordName(record) {
  return clean(record.formData?.nome || record.report?.nome);
}

function recordCompany(record) {
  return clean(record.formData?.empresa || record.report?.empresa);
}

export function isTestLead(record) {
  const leadId = clean(record.leadId);
  if (!leadId) return false;
  if (FIXTURE_LEAD_IDS.has(leadId)) return true;
  if (TEST_LEAD_IDS.has(leadId)) return true;
  if (TEST_LEAD_ID_PREFIXES.some((prefix) => leadId.startsWith(prefix))) return true;

  const email = recordEmail(record);
  const company = recordCompany(record).toLowerCase();
  const name = recordName(record).toLowerCase();

  if (email && TEST_EMAIL_DOMAINS.some((domain) => email.endsWith(domain))) return true;
  if (/^teste e2e\b/i.test(name)) return true;
  if (/\bteste$/i.test(company) || /saas teste/i.test(company) || /servicos teste/i.test(company)) return true;
  if (company === 'empresa alpha' && email === 'ana@example.com') return true;
  if (name === 'ana founder' && company === 'empresa alpha') return true;
  if (name === 'bernardo kawano' && company === 'empresa alpha' && email === 'bernardo@masterboard.com.br' && leadId === 'demo-chat') {
    return true;
  }

  return false;
}

async function fetchRecords() {
  const response = await fetch(`${API_BASE}/api/dashboard?token=${encodeURIComponent(TOKEN)}`, {
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Falha ao listar leads (${response.status})`);
  return payload.records || [];
}

async function deleteLead(leadId) {
  const response = await fetch(`${API_BASE}/api/dashboard?token=${encodeURIComponent(TOKEN)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ leadId, action: 'delete' }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Falha ao excluir ${leadId}`);
  return payload;
}

async function main() {
  if (!TOKEN) {
    console.error('Defina DASHBOARD_TOKEN no ambiente.');
    process.exit(1);
  }

  const records = await fetchRecords();
  const targets = records.filter((record) => !record.deletedAt && isTestLead(record));

  console.log(`Total visível: ${records.filter((record) => !record.deletedAt).length}`);
  console.log(`Leads de teste encontrados: ${targets.length}`);

  targets.forEach((record) => {
    console.log(`- ${record.leadId} | ${recordName(record) || '-'} | ${recordEmail(record) || '-'} | ${recordCompany(record) || '-'}`);
  });

  if (!targets.length) {
    console.log('Nenhum lead de teste para remover.');
    return;
  }

  if (dryRun) {
    console.log('Dry-run: nenhuma exclusão enviada.');
    return;
  }

  let removed = 0;
  for (const record of targets) {
    await deleteLead(record.leadId);
    removed += 1;
    console.log(`Excluído: ${record.leadId}`);
  }

  console.log(`Concluído: ${removed} lead(s) de teste removido(s) do dashboard.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
