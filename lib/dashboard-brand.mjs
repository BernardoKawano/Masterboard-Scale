/**
 * Tokens Masterboard × ScaleCo (brandbook / design system).
 * Fonte única para dashboard web e documentos de impressão/PDF.
 */
export const BRAND = {
  gold: '#FBBE0A',
  goldDark: '#C99703',
  goldReadableOnLight: '#7A5A00',
  black: '#000000',
  ink: '#0A0A0A',
  graphite: '#333333',
  slate: '#666666',
  muted: '#9A9A9A',
  paper: '#E8E8E8',
  surface: '#111111',
  textOnDark: '#F4F4F4',
  textMutedOnDark: 'rgba(244, 244, 244, 0.72)',
  lineOnDark: 'rgba(255, 255, 255, 0.10)',
};

/** CSS :root para o dashboard (tema escuro). */
export function getDashboardRootCss() {
  return `
:root {
  --bg: ${BRAND.ink};
  --panel: ${BRAND.surface};
  --panel-2: #181818;
  --line: ${BRAND.lineOnDark};
  --text: ${BRAND.textOnDark};
  --muted: ${BRAND.muted};
  --muted-2: #D4D4D4;
  --yellow: ${BRAND.gold};
  --yellow-2: ${BRAND.goldDark};
  --green: #22C55E;
  --orange: #F59E0B;
  --red: #EF4444;
  --blue: #60A5FA;
}`.trim();
}

/**
 * Folha de estilos para relatórios impressos (PDF via window.print).
 * Usa modo papel do brandbook: fundo claro, texto ink, acentos legíveis.
 */
export function getPrintDocumentStyles() {
  return `
:root {
  --print-ink: ${BRAND.ink};
  --print-graphite: ${BRAND.graphite};
  --print-slate: ${BRAND.slate};
  --print-gold: ${BRAND.gold};
  --print-gold-readable: ${BRAND.goldReadableOnLight};
  --print-paper: #F7F7F5;
  --print-line: #D4D4D4;
}
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  background: #fff;
  color: var(--print-ink);
  font-family: 'Funnel Display', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.55;
  margin: 0;
}
.wrap { max-width: 1040px; margin: 0 auto; padding: 32px 22px 56px; }
.top { align-items: flex-start; display: flex; gap: 18px; justify-content: space-between; margin-bottom: 20px; }
.actions { display: flex; gap: 8px; position: sticky; top: 12px; z-index: 2; }
.btn {
  background: var(--print-ink);
  border: 0;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  font-weight: 800;
  padding: 10px 13px;
}
.btn.secondary { background: #fff; border: 1px solid var(--print-line); color: var(--print-ink); }
.hero {
  background: var(--print-paper);
  border: 1px solid var(--print-line);
  border-left: 5px solid var(--print-gold);
  border-radius: 18px;
  color: var(--print-ink);
  padding: 24px;
}
.eyebrow, .label {
  color: var(--print-gold-readable);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
h1 {
  color: var(--print-ink);
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin: 7px 0;
}
h2 {
  border-top: 1px solid var(--print-line);
  color: var(--print-graphite);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.12em;
  margin: 24px 0 12px;
  padding-top: 18px;
  text-transform: uppercase;
}
.muted { color: var(--print-slate); font-size: 13px; }
.hero .muted { color: var(--print-slate); }
.grid { display: grid; gap: 10px; grid-template-columns: repeat(3, 1fr); margin-top: 16px; }
.box {
  background: #fff;
  border: 1px solid var(--print-line);
  border-radius: 14px;
  padding: 12px;
}
.value { color: var(--print-ink); font-weight: 800; margin-top: 4px; word-break: break-word; }
.score-row { align-items: center; display: grid; gap: 18px; grid-template-columns: 140px 1fr; }
.score {
  border-left: 5px solid var(--print-gold);
  color: var(--print-ink);
  font-size: 54px;
  font-weight: 900;
  letter-spacing: -0.06em;
  line-height: 1;
  padding-left: 14px;
}
table { border-collapse: collapse; width: 100%; }
td, th {
  border: 1px solid var(--print-line);
  color: var(--print-ink);
  padding: 8px;
  text-align: left;
  vertical-align: top;
}
th {
  background: var(--print-paper);
  color: var(--print-graphite);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pre, .qa-card {
  background: #fff;
  border: 1px solid var(--print-line);
  border-radius: 14px;
  color: var(--print-ink);
}
.pre { padding: 14px; white-space: pre-wrap; }
.qa-list { display: grid; gap: 12px; }
.qa-card { break-inside: avoid; padding: 16px; }
.question { color: var(--print-ink); font-size: 16px; font-weight: 800; line-height: 1.35; margin-top: 6px; }
.qa-card h2 {
  border-top: 0;
  color: var(--print-ink);
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.3;
  margin: 8px 0 0;
  padding-top: 0;
  text-transform: none;
}
.answer {
  background: var(--print-paper);
  border-left: 4px solid var(--print-gold);
  border-radius: 12px;
  color: var(--print-graphite);
  margin-top: 12px;
  padding: 12px;
  white-space: pre-wrap;
}
.answer strong { color: var(--print-ink); }
ol, p { color: var(--print-graphite); }
ol li { margin-bottom: 6px; }
@media print {
  body { background: #fff; }
  .wrap { max-width: none; padding: 18px; }
  .actions { display: none; }
  .hero, .box, .pre, .qa-card { box-shadow: none; }
  h2 { break-after: avoid; }
  .qa-card, .box { break-inside: avoid; }
}
@media (max-width: 760px) {
  .top { display: block; }
  .actions { margin-top: 12px; }
  .grid { grid-template-columns: 1fr; }
  .score-row { grid-template-columns: 1fr; }
}`.trim();
}

/** Garante que estilos de impressão não reintroduzem combinações de baixo contraste. */
export function assertPrintStylesReadable(css) {
  const forbidden = [
    { pattern: /\.hero\{[^}]*background:\s*#111/, reason: 'hero escuro dificulta leitura em PDF' },
    { pattern: /\.eyebrow[^}]*#9b7400/, reason: 'dourado escuro ilegível em fundos escuros' },
    { pattern: /\.score\{[^}]*color:\s*#C99703/, reason: 'score dourado sobre fundo claro tem contraste insuficiente' },
  ];
  const failures = forbidden.filter(({ pattern }) => pattern.test(css)).map(({ reason }) => reason);
  if (failures.length) {
    throw new Error(`Estilos de impressão com contraste inadequado: ${failures.join('; ')}`);
  }
  return true;
}
