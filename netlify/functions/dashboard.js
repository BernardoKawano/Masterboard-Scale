const { timingSafeEqual } = require('node:crypto');
const { connectBlobLambda, listDashboardRecords, updateDashboardRecord } = require('./_blobStore');
const { createAdminPatch } = require('./_records');

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'PATCH') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  const configuredToken = process.env.DASHBOARD_TOKEN;
  if (!configuredToken) {
    return jsonResponse(500, { error: 'DASHBOARD_TOKEN nao configurado.' });
  }

  const token = getRequestToken(event);
  if (!isValidToken(token, configuredToken)) {
    return jsonResponse(401, { error: 'Token invalido.' });
  }

  try {
    connectBlobLambda(event);

    if (event.httpMethod === 'PATCH') {
      const body = parseJsonBody(event);
      const patch = createAdminPatch(body.leadId, body.action);
      const { record, durationMs } = await updateDashboardRecord(patch);

      return jsonResponse(200, {
        updatedAt: new Date().toISOString(),
        durationMs,
        record,
      });
    }

    const { records, summaries, durationMs } = await listDashboardRecords();
    const visibleRecords = records.filter((record) => !record.deletedAt);
    const visibleSummaries = summaries.filter((summary) => !summary.deletedAt);

    return jsonResponse(200, {
      generatedAt: new Date().toISOString(),
      listDurationMs: durationMs,
      metrics: buildMetrics(visibleSummaries),
      summaries: visibleSummaries,
      records: visibleRecords,
    });
  } catch (error) {
    console.error(`[dashboard_metric] request_failed method=${event.httpMethod} error=${error.message}`);
    const statusCode = event.httpMethod === 'PATCH' && /leadId|Acao|JSON/.test(error.message) ? 400 : 500;
    return jsonResponse(statusCode, { error: statusCode === 400 ? error.message : 'Nao foi possivel carregar o dashboard.' });
  }
};

function getRequestToken(event) {
  const queryToken = event.queryStringParameters?.token;
  if (queryToken) return queryToken;

  const headers = event.headers || {};
  const explicitToken = headers['x-dashboard-token'] || headers['X-Dashboard-Token'];
  if (explicitToken) return explicitToken;

  const auth = headers.authorization || headers.Authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();

  return '';
}

function isValidToken(candidate, expected) {
  if (!candidate || !expected) return false;
  const candidateBuffer = Buffer.from(String(candidate));
  const expectedBuffer = Buffer.from(String(expected));
  if (candidateBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(candidateBuffer, expectedBuffer);
}

function buildMetrics(summaries) {
  const totals = summaries.reduce((acc, item) => {
    acc.total += 1;
    acc[item.status] = (acc[item.status] || 0) + 1;
    if (item.commercialStatus === 'converted') acc.converted += 1;
    if (item.commercialStatus === 'sold') {
      acc.converted += 1;
      acc.sold += 1;
    }
    if (item.status === 'completed' && item.score_geral > 0) {
      acc.scoreSum += item.score_geral;
      acc.scoreCount += 1;
    }
    return acc;
  }, {
    total: 0,
    captured: 0,
    started: 0,
    completed: 0,
    error: 0,
    converted: 0,
    sold: 0,
    scoreSum: 0,
    scoreCount: 0,
  });

  return {
    total: totals.total,
    captured: totals.captured,
    started: totals.started,
    completed: totals.completed,
    error: totals.error,
    converted: totals.converted,
    sold: totals.sold,
    conversionRate: totals.total ? Math.round((totals.converted / totals.total) * 100) : 0,
    soldRate: totals.converted ? Math.round((totals.sold / totals.converted) * 100) : 0,
    averageScore: totals.scoreCount ? Math.round(totals.scoreSum / totals.scoreCount) : 0,
  };
}

function parseJsonBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    throw new Error('JSON invalido.');
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: statusCode === 204 ? '' : JSON.stringify(body),
  };
}
