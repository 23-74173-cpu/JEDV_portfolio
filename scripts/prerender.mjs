import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const ssrDir = path.join(rootDir, 'dist-ssr');

// Contribution grid: the ghchart endpoint serves parsable SVG rects
// (fill + data-score + data-date), so the client can render the grid from
// data with theme tokens instead of filtering the image. Runtime fetch is
// not an option (no CORS headers), so this runs at build time in Node.
// Any failure skips the embed and the client falls back to the image.
const GH_USER = '23-74173-cpu';
const FILL_LEVEL = {
  '#eeeeee': 0,
  '#c6e48b': 1,
  '#7bc96f': 2,
  '#239a3b': 3,
  '#196127': 4,
};

async function fetchChartData() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`https://ghchart.rshah.org/${GH_USER}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'jedv-portfolio-prerender' },
    });
    if (!response.ok) throw new Error(`ghchart HTTP ${response.status}`);
    const svg = await response.text();
    const cells = [];
    for (const match of svg.matchAll(/<rect[^>]*>/g)) {
      const tag = match[0];
      const attr = (name) => (tag.match(new RegExp(`${name}="([^"]*)"`)) || [])[1];
      const x = Number(attr('x'));
      const y = Number(attr('y'));
      const date = attr('data-date');
      const score = Number(attr('data-score'));
      const fill = (tag.match(/fill:(#[0-9a-fA-F]{6})/) || [])[1];
      if (!Number.isFinite(x) || !Number.isFinite(y) || !date || !fill) continue;
      const col = Math.round((x - 27) / 12);
      const row = Math.round((y - 20) / 12);
      if (col < 0 || row < 0 || row > 6) continue;
      let level = FILL_LEVEL[fill.toLowerCase()];
      if (level === undefined) {
        level = score <= 0 ? 0 : score <= 1 ? 1 : score <= 4 ? 2 : score <= 8 ? 3 : 4;
      }
      cells.push([col, row, level, date, Number.isFinite(score) ? score : 0]);
    }
    if (cells.length === 0) throw new Error('ghchart parsed zero cells');
    const dates = cells.map((cell) => cell[3]).sort();
    const total = cells.reduce((sum, cell) => sum + cell[4], 0);
    return { total, start: dates[0], end: dates[dates.length - 1], cells };
  } finally {
    clearTimeout(timer);
  }
}

const mod = await import(path.join(ssrDir, 'entry-server.js'));
const html = mod.render();
if (typeof html !== 'string' || !html.includes('HILOM EHR')) {
  throw new Error('prerender: SSR output missing expected content');
}

let chartTag = '';
try {
  const data = await fetchChartData();
  chartTag = `<script id="gh-data" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  console.log(`prerender: embedded ${data.cells.length} contribution cells`);
} catch (error) {
  console.log(`prerender: chart embed skipped (${error.message || error})`);
}

const indexPath = path.join(distDir, 'index.html');
const index = readFileSync(indexPath, 'utf8');
if (!index.includes('<div id="root"></div>')) {
  throw new Error('prerender: root div not found in dist/index.html');
}
writeFileSync(indexPath, index.replace('<div id="root"></div>', `${chartTag}<div id="root">${html}</div>`));
rmSync(ssrDir, { recursive: true, force: true });
console.log(`prerender: injected ${html.length} chars into dist/index.html`);
