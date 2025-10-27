#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const FILES = [
  { label: 'Core shell', path: 'index.html', group: 'core' },
  { label: 'Theme CSS', path: 'css/theme.css', group: 'core' },
  { label: 'Loader runtime', path: 'js/loader.js', group: 'core' },
  { label: 'App entry', path: 'js/app.js', group: 'core' },
  { label: 'Home view', path: 'js/home.js', group: 'core' },
  { label: 'Compendium UI', path: 'js/compendium.js', group: 'compendium' },
  { label: 'Compendium worker', path: 'js/compendium-worker.js', group: 'compendium' },
  { label: 'Builder wizard', path: 'builder/wizard.js', group: 'builder' },
  { label: 'Builder summary', path: 'builder/summary.js', group: 'builder' }
];

const BUDGETS = {
  core: 160 * 1024
};

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function measureBuffer(buffer) {
  const raw = buffer.length;
  const gz = gzipSync(buffer).length;
  const br = brotliCompressSync(buffer, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 5
    }
  }).length;
  return { raw, gz, br };
}

async function readFileMetrics(entry) {
  const filePath = path.join(ROOT, entry.path);
  const buffer = await fs.readFile(filePath);
  const metrics = measureBuffer(buffer);
  return { ...entry, metrics };
}

function printTable(results) {
  const header = ['Asset', 'Group', 'Raw', 'Gzip', 'Brotli'];
  const rows = results.map(({ label, group, metrics }) => [
    label,
    group,
    formatBytes(metrics.raw),
    formatBytes(metrics.gz),
    formatBytes(metrics.br)
  ]);
  const widths = header.map((_, index) =>
    Math.max(header[index].length, ...rows.map((row) => row[index].length))
  );

  const formatRow = (cells) =>
    cells
      .map((cell, index) => cell.padEnd(widths[index]))
      .join('  ');

  console.log(formatRow(header));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  rows.forEach((row) => console.log(formatRow(row)));
}

function checkBudgets(results) {
  Object.entries(BUDGETS).forEach(([group, budget]) => {
    const groupTotal = results
      .filter((entry) => entry.group === group)
      .reduce((total, entry) => total + entry.metrics.gz, 0);
    const withinBudget = groupTotal <= budget;
    const status = withinBudget ? 'OK' : 'OVER';
    console.log(
      `\n${group.toUpperCase()} bundle (gzip): ${formatBytes(groupTotal)} — ${status} (budget ${formatBytes(budget)})`
    );
  });
}

async function main() {
  const results = await Promise.all(FILES.map(readFileMetrics));
  printTable(results);
  checkBudgets(results);
}

main().catch((error) => {
  console.error('Bundle report failed', error);
  process.exitCode = 1;
});
