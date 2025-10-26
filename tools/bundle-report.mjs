import { promises as fs } from 'fs';
import { resolve, join } from 'path';
import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'zlib';

const ROOT = resolve(process.cwd());
const TARGETS = [
  'index.html',
  'builder/index.html',
  'compendium/index.html',
  'js/loader.js',
  'builder/wizard.js',
  'builder/summary.js',
  'compendium/app.js',
  'manifest.webmanifest'
];

function formatBytes(value) {
  const units = ['B', 'KB', 'MB'];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

async function readFile(target) {
  try {
    const file = await fs.readFile(join(ROOT, target));
    return file;
  } catch (error) {
    console.warn(`Unable to read ${target}`, error.message);
    return null;
  }
}

async function main() {
  const rows = [];
  for (const target of TARGETS) {
    const file = await readFile(target);
    if (!file) continue;
    const gzip = gzipSync(file, { level: 9 });
    const brotli = brotliCompressSync(file, {
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 11
      }
    });
    rows.push({
      file: target,
      raw: file.length,
      gzip: gzip.length,
      brotli: brotli.length
    });
  }

  rows.sort((a, b) => b.raw - a.raw);

  const header = ['File', 'Raw', 'Gzip', 'Brotli'];
  const lines = [header];
  rows.forEach(({ file, raw, gzip, brotli }) => {
    lines.push([file, formatBytes(raw), formatBytes(gzip), formatBytes(brotli)]);
  });

  const widths = header.map((_, index) => Math.max(...lines.map((line) => String(line[index]).length)));
  const output = lines
    .map((line) => line.map((cell, index) => String(cell).padEnd(widths[index])).join('  '))
    .join('\n');

  console.log(output);
}

main().catch((error) => {
  console.error('Bundle report failed', error);
  process.exitCode = 1;
});
