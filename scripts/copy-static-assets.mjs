import { cp, copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'dist');

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function copyIfPresent(source, target) {
  if (!(await exists(source))) return;

  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
}

async function copyDirIfPresent(source, target) {
  if (!(await exists(source))) return;

  await cp(source, target, { recursive: true });
}

await mkdir(outDir, { recursive: true });

await Promise.all([
  copyIfPresent(join(root, 'index.html'), join(outDir, 'index.html')),
  copyIfPresent(join(root, 'aceite.html'), join(outDir, 'aceite.html')),
  copyIfPresent(join(root, 'dashboard.html'), join(outDir, 'dashboard.html')),
  copyIfPresent(join(root, 'archie.jpeg'), join(outDir, 'archie.jpeg')),
  copyDirIfPresent(join(root, 'assets'), join(outDir, 'assets')),
  copyDirIfPresent(join(root, 'lib'), join(outDir, 'lib')),
]);

console.log('Legacy static pages copied to dist.');
