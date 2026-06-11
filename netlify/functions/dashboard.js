const { timingSafeEqual } = require('node:crypto');
const { connectBlobLambda, listDashboardRecords } = require('./_blobStore');

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  if (event.httpMethod !== 'GET') {
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
    const { records, summaries, durationMs } = await listDashboardRecords();

    return jsonResponse(200, {
      generatedAt: new Date().toISOString(),
      listDurationMs: durationMs,
      metrics: buildMetrics(summaries),
      summaries,
      records,
    });
  } catch (error) {
    console.error(`[dashboard_metric] list_failed error=${error.message}`);
    return jsonResponse(500, { error: 'Nao foi possivel carregar o dashboard.' });
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
    scoreSum: 0,
    scoreCount: 0,
  });

  return {
    total: totals.total,
    captured: totals.captured,
    started: totals.started,
    completed: totals.completed,
    error: totals.error,
    averageScore: totals.scoreCount ? Math.round(totals.scoreSum / totals.scoreCount) : 0,
  };
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
