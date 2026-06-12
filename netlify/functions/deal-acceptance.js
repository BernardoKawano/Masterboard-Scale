const {
  createDealAcceptancePatch,
  normalizeDealAcceptanceData,
} = require('./_records');
const { connectBlobLambda, saveRecordPatch } = require('./_blobStore');

const VALID_PRODUCTS = new Set(['Scale', 'Masterboard Club']);
const VALID_PAYMENT_OPTIONS = new Set(['Cartão - à vista', 'Cartão - parcelado']);

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function validateAcceptance(data) {
  const errors = [];
  const documentLength = data.documento_numero.length;

  if (!data.nome) errors.push('nome');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('email');
  if (!data.telefone) errors.push('telefone');
  if (![11, 14].includes(documentLength)) errors.push('documento');
  if (!data.empresa) errors.push('empresa');
  if (!VALID_PRODUCTS.has(data.produto)) errors.push('produto');
  if (!VALID_PAYMENT_OPTIONS.has(data.forma_pagamento)) errors.push('forma_pagamento');
  if (!data.aceite) errors.push('aceite');
  if (!data.lgpd) errors.push('lgpd');

  return errors;
}

function detailRows(data) {
  const rows = [
    ['Responsável', data.nome],
    ['Email', data.email],
    ['Telefone', data.telefone || data.whatsapp],
    ['CNPJ/CPF', data.documento],
    ['Empresa', data.empresa],
    ['Razão social', data.razao_social],
    ['Site', data.website],
    ['Localização', data.localizacao],
    ['Endereço', data.endereco],
    ['Produto', data.produto],
    ['Forma de pagamento', data.forma_pagamento],
  ];

  return rows
    .filter(([, value]) => value)
    .map(([label, value]) => `<strong style="color:#FBBE0A;">${label}:</strong> ${escapeHtml(value)}<br>`)
    .join('');
}

async function sendDealAcceptanceEmail(data) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;

  const whatsappDigits = String(data.telefone || data.whatsapp || '').replace(/\D/g, '');
  const website = normalizeUrl(data.website);
  const websiteLine = website
    ? `<div style="margin-top:12px;"><a href="${escapeHtml(website)}" style="color:#FBBE0A;">Abrir site informado</a></div>`
    : '';
  const whatsappLine = whatsappDigits
    ? `<a href="https://wa.me/${whatsappDigits}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;padding:12px 24px;font-weight:700;font-size:14px;">CHAMAR NO WHATSAPP</a>`
    : '';

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;">
<div style="max-width:620px;margin:24px auto;background:#111;border-radius:12px;overflow:hidden;border:1px solid #222;">
  <div style="background:linear-gradient(135deg,#FBBE0A,#C99703);padding:30px 32px;text-align:center;">
    <div style="font-size:20px;font-weight:700;color:#000;letter-spacing:2px;">MASTERBOARD × SCALECO</div>
    <div style="font-size:11px;letter-spacing:4px;color:#000;opacity:0.62;margin-top:4px;">ACEITE DE FECHAMENTO</div>
    <div style="font-size:17px;font-weight:700;color:#000;margin-top:12px;">NOVO NEGÓCIO ACEITO</div>
  </div>
  <div style="padding:30px 32px;">
    <div style="background:#1a1a1a;border-radius:8px;padding:20px;font-size:14px;color:#ccc;line-height:2.15;border:1px solid #2a2a2a;">
      ${detailRows(data)}
    </div>
    <div style="margin-top:16px;padding:14px;background:#1a1500;border:1px solid #3a2900;border-radius:8px;font-size:13px;color:#aaa;line-height:1.7;">
      Este registro confirma intenção de fechamento. Nenhuma cobrança automática foi iniciada pelo formulário.
    </div>
    ${websiteLine}
    <div style="margin-top:22px;text-align:center;">${whatsappLine}</div>
  </div>
  <div style="padding:16px;border-top:1px solid #222;text-align:center;font-size:11px;color:#555;">Masterboard × ScaleCo · aceite de fechamento</div>
</div></body></html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: 'Archie · ScaleCo <noreply@scaleco.ai>',
      to: ['fabio@scaleco.ai', 'bernardo.kawano@masterboard.com.br'],
      subject: `[Aceite] ${data.empresa || data.nome} · ${data.produto} · ${data.forma_pagamento}`,
      html,
    }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    console.error('Resend deal acceptance error:', JSON.stringify(result));
  }
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  try {
    connectBlobLambda(event);

    const body = JSON.parse(event.body || '{}');
    const rawData = body.formData && typeof body.formData === 'object' ? body.formData : body;

    if (rawData._gotcha) {
      return json(200, { ok: true });
    }

    const normalized = normalizeDealAcceptanceData(rawData);
    const errors = validateAcceptance(normalized);
    if (errors.length > 0) {
      return json(400, {
        error: 'Campos obrigatórios inválidos.',
        fields: errors,
      });
    }

    const patch = createDealAcceptancePatch(normalized);
    const { record } = await saveRecordPatch(patch);

    await sendDealAcceptanceEmail(record.acceptanceData || record.formData || normalized);

    return json(200, {
      ok: true,
      acceptanceId: record.leadId,
    });
  } catch (error) {
    console.error('Deal acceptance error:', error);
    return json(500, { error: 'Erro ao registrar aceite.' });
  }
};
