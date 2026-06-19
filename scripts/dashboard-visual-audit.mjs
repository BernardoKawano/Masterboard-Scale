import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, '.audit-screenshots');
const port = 3456;
const baseUrl = `http://127.0.0.1:${port}`;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function createStaticServer() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', baseUrl);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/') pathname = '/dashboard.html';
      const filePath = join(root, pathname.replace(/^\//, ''));
      if (!filePath.startsWith(root)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
}

async function shot(page, name) {
  const path = join(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log(`saved ${path}`);
}

async function shotFrame(page, name) {
  const path = join(outDir, `${name}.png`);
  await page.locator('#previewFrame').screenshot({ path });
  console.log(`saved ${path}`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${baseUrl}/dashboard.html?fixture=1&view=home`);
  await page.waitForSelector('#app:not([hidden])');
  await shot(page, '01-home');

  for (const view of ['leads', 'kanban', 'acceptances', 'pipeline', 'insights']) {
    await page.click(`[data-view="${view}"]`);
    await page.waitForTimeout(250);
    await shot(page, `02-${view}`);
  }

  await page.click('[data-view="leads"]');
  await page.click('[data-open="fixture_completed_hot"]');
  await page.waitForSelector('.drawer.open');
  await shot(page, '03-drawer-lead');

  await page.click('[data-drawer-action="pdf"]');
  await page.waitForSelector('#previewBackdrop.open');
  await page.frameLocator('#previewFrame').locator('h1').first().waitFor();
  await shot(page, '05-preview-pdf-modal');
  await shotFrame(page, '05-preview-pdf-content');
  await page.click('#previewCloseButton');
  await page.waitForSelector('#previewBackdrop:not(.open)');
  await page.click('[data-drawer-action="close"]');
  await page.waitForSelector('.drawer:not(.open)');

  await page.goto(`${baseUrl}/dashboard.html?fixture=1&view=acceptances`);
  await page.waitForSelector('[data-open="fixture_acceptance"]');
  await page.click('[data-open="fixture_acceptance"]');
  await page.waitForSelector('.drawer.open');
  await shot(page, '04-drawer-acceptance');

  await browser.close();
  server.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
