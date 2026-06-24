/** Helpers de layout mobile do dashboard. */

export const DASHBOARD_MOBILE_MAX_WIDTH = 760;

export function isCoarsePointer() {
  if (typeof matchMedia === 'undefined') return false;
  return matchMedia('(pointer: coarse)').matches;
}

export function getTableScrollHintText(coarsePointer = isCoarsePointer()) {
  return coarsePointer
    ? 'Deslize para ver mais colunas'
    : 'Role horizontalmente · Shift + roda · ou arraste';
}

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Card de lead para listagem mobile (substitui tabela larga).
 * `parts` traz HTML já escapado/renderizado pelos helpers do dashboard.
 */
export function buildLeadMobileCardHtml(record, parts) {
  const id = escapeAttr(record.leadId);
  const checked = parts.selected ? 'checked' : '';

  return `<article class="lead-mobile-card">
    <label class="lead-mobile-check" aria-label="Selecionar lead">
      <input type="checkbox" data-check="${id}" ${checked}>
    </label>
    <button class="lead-mobile-body" data-open="${id}" type="button">
      <div class="lead-mobile-head">
        <strong class="lead-name">${parts.name}</strong>
        <span class="score">${parts.score}</span>
      </div>
      <div class="lead-sub">${parts.subtitle}</div>
      <div class="lead-mobile-pills">${parts.pills}</div>
      <dl class="lead-mobile-facts">
        <div><dt>Produto</dt><dd>${parts.produto}</dd></div>
        <div><dt>Pagamento</dt><dd>${parts.pagamento}</dd></div>
        <div><dt>Região</dt><dd>${parts.regiao}</dd></div>
        <div><dt>Chegada</dt><dd>${parts.chegada}</dd></div>
      </dl>
    </button>
    <div class="lead-mobile-actions">
      <button class="icon" data-open="${id}" type="button">Abrir</button>
      <button class="icon" data-admin="mark_won" data-id="${id}" type="button">Deu certo</button>
      <button class="icon" data-admin="mark_lost" data-id="${id}" type="button">Não deu</button>
    </div>
  </article>`;
}

export function buildAcceptanceMobileCardHtml(record, parts) {
  const id = escapeAttr(record.leadId);

  return `<article class="lead-mobile-card acceptance-mobile-card">
    <button class="lead-mobile-body" data-open="${id}" type="button">
      <div class="lead-mobile-head">
        <strong class="lead-name">${parts.empresa}</strong>
        <span class="pill captured">${parts.date}</span>
      </div>
      <div class="lead-sub">${parts.responsavel}</div>
      <dl class="lead-mobile-facts">
        <div><dt>Produto</dt><dd>${parts.produto}</dd></div>
        <div><dt>Pagamento</dt><dd>${parts.pagamento}</dd></div>
        <div><dt>Região</dt><dd>${parts.regiao}</dd></div>
      </dl>
    </button>
    <div class="lead-mobile-actions">
      <button class="icon" data-open="${id}" type="button">Abrir</button>
      <button class="icon" data-admin="mark_lost" data-id="${id}" type="button">Não deu</button>
    </div>
  </article>`;
}
