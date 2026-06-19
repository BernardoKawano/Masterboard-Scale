/**
 * Smoke test de UX do dashboard (fixture mode).
 * Uso: node scripts/dashboard-ux-smoke.mjs
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = 3457;
const baseUrl = `http://127.0.0.1:${port}`;
const mime = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpeg': 'image/jpeg' };

function createStaticServer() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', baseUrl);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/') pathname = '/dashboard.html';
      const filePath = join(root, pathname.replace(/^\//, ''));
      if (!filePath.startsWith(root)) return res.writeHead(403).end();
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
}

async function main() {
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];

  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${baseUrl}/dashboard.html?fixture=1&view=pipeline`);
  await page.waitForSelector('#commercialPipeline .commercial-pipeline-row');

  const rows = await page.locator('.commercial-pipeline-row').count();
  if (rows !== 6) errors.push(`Esperava 6 estágios, encontrou ${rows}`);

  await page.click('[data-pipeline-stage="prospeccao"]');
  await page.waitForSelector('.pipeline-lead');
  const leads = await page.locator('.pipeline-lead').count();
  if (leads < 1) errors.push('Filtro de estágio não listou leads');

  await page.click('.pipeline-lead');
  await page.waitForSelector('.drawer.open');
  const stageButtons = await page.locator('[data-drawer-action="set_pipeline_stage"]').count();
  if (stageButtons !== 6) errors.push(`Drawer deveria ter 6 botões de estágio, tem ${stageButtons}`);

  await page.click('[data-drawer-action="set_pipeline_stage"][data-stage="negociacao"]');
  await page.waitForSelector('.toast.visible');
  const toast = await page.locator('.toast').innerText();
  if (!/negocia/i.test(toast)) errors.push(`Toast inesperado após mudar estágio: ${toast}`);
  await page.click('[data-drawer-action="close"]');
  await page.waitForSelector('.drawer:not(.open)');

  await page.setViewportSize({ width: 960, height: 900 });
  await page.click('[data-view="leads"]');
  await page.waitForSelector('#leadsPage.active .table-scroll-wrap.can-scroll-x');
  const before = await page.locator('.table-scroll').first().evaluate((el) => el.scrollLeft);
  await page.locator('.table-scroll').first().evaluate((el) => { el.scrollLeft += 240; });
  const after = await page.locator('.table-scroll').first().evaluate((el) => el.scrollLeft);
  if (after <= before) errors.push('Scroll horizontal da tabela de leads não moveu');

  for (const view of ['home', 'kanban', 'acceptances', 'insights']) {
    await page.click(`[data-view="${view}"]`);
    await page.waitForTimeout(150);
    if (!(await page.locator(`#${view}Page.active`).count())) errors.push(`Aba ${view} não ativou`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('[data-view="leads"]');
  await page.waitForSelector('#leadsPage.active #leadsMobileList .lead-mobile-card');
  const desktopTableVisible = await page.locator('#leadsPage .table-card.desktop-only').isVisible();
  if (desktopTableVisible) errors.push('Tabela desktop não deveria aparecer no mobile');

  await page.locator('#leadsMobileList .lead-mobile-body').first().click();
  await page.waitForSelector('.drawer.open');
  await page.click('[data-drawer-action="close"]');
  await page.waitForSelector('.drawer:not(.open)');

  const navBox = await page.locator('.nav').boundingBox();
  if (!navBox || navBox.y < 700) errors.push('Navegação inferior não está fixa no mobile');

  await browser.close();
  server.close();

  if (errors.length) {
    console.error('Falhas de UX:\n' + errors.map((item) => `- ${item}`).join('\n'));
    process.exit(1);
  }

  console.log('UX smoke OK: pipeline, drawer, scroll, mobile e navegação.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
