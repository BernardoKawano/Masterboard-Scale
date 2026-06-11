const { timingSafeEqual } = require('node:crypto');
const { connectBlobLambda, saveRecordPatch } = require('./_blobStore');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
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

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return jsonResponse(400, { error: 'JSON invalido.' });
  }

  if (payload.confirm !== 'IMPORT_HISTORY') {
    return jsonResponse(400, { error: 'Confirmacao ausente.' });
  }

  const records = Array.isArray(payload.records) ? payload.records : [];
  if (!records.length) {
    return jsonResponse(400, { error: 'Nenhum registro enviado.' });
  }

  if (records.length > 250) {
    return jsonResponse(400, { error: 'Importe no maximo 250 registros por chamada.' });
  }

  try {
    connectBlobLambda(event);

    let imported = 0;
    const failures = [];
    for (const record of records) {
      try {
        await saveRecordPatch({
          ...record,
          events: [
            ...(record.events || []),
            { type: 'history_imported', at: new Date().toISOString() },
          ],
        });
        imported += 1;
      } catch (error) {
        failures.push({ leadId: record.leadId || '', error: error.message });
      }
    }

    console.log(`[dashboard_metric] history_import imported=${imported} failed=${failures.length}`);

    return jsonResponse(200, {
      imported,
      failed: failures.length,
      failures,
    });
  } catch (error) {
    console.error(`[dashboard_metric] history_import_failed error=${error.message}`);
    return jsonResponse(500, { error: 'Nao foi possivel importar o historico.' });
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

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}
