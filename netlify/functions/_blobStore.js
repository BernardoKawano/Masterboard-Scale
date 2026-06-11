const {
  STORE_NAME,
  getRecordKey,
  mergeRecord,
  summarizeRecord,
} = require('./_records');

function connectBlobLambda(event) {
  const { connectLambda } = require('@netlify/blobs');
  connectLambda(event);
}

function getDiagnosticsStore() {
  const { getStore } = require('@netlify/blobs');

  return getStore(STORE_NAME);
}

async function readRecord(store, leadId) {
  try {
    return await store.get(getRecordKey(leadId), { type: 'json' });
  } catch (error) {
    if (error && (error.status === 404 || error.statusCode === 404)) return null;
    return null;
  }
}

async function saveRecordPatch(patch) {
  const startedAt = Date.now();
  const store = getDiagnosticsStore();
  const existing = await readRecord(store, patch.leadId);
  const record = mergeRecord(existing, patch);
  const key = getRecordKey(record.leadId);

  await store.setJSON(key, record, {
    metadata: {
      status: record.status || '',
      email: record.formData?.email || '',
      updatedAt: record.updatedAt || '',
    },
  });

  const durationMs = Date.now() - startedAt;
  console.log(`[dashboard_metric] write status=${record.status} leadId=${record.leadId} durationMs=${durationMs}`);

  return { record, durationMs };
}

async function listDashboardRecords() {
  const startedAt = Date.now();
  const store = getDiagnosticsStore();
  const { blobs } = await store.list({ prefix: 'leads/' });

  const records = [];
  for (const blob of blobs || []) {
    const record = await store.get(blob.key, { type: 'json' });
    if (record) records.push(record);
  }

  records.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));

  const durationMs = Date.now() - startedAt;
  console.log(`[dashboard_metric] list total=${records.length} durationMs=${durationMs}`);

  return {
    durationMs,
    records,
    summaries: records.map(summarizeRecord),
  };
}

module.exports = {
  connectBlobLambda,
  listDashboardRecords,
  saveRecordPatch,
};
