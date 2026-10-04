import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const ssrDir = path.join(rootDir, 'dist-ssr');

const mod = await import(path.join(ssrDir, 'entry-server.js'));
const html = mod.render();
if (typeof html !== 'string' || !html.includes('HILOM EHR')) {
  throw new Error('prerender: SSR output missing expected content');
}

const indexPath = path.join(distDir, 'index.html');
const index = readFileSync(indexPath, 'utf8');
if (!index.includes('<div id="root"></div>')) {
  throw new Error('prerender: root div not found in dist/index.html');
}
writeFileSync(indexPath, index.replace('<div id="root"></div>', `<div id="root">${html}</div>`));
rmSync(ssrDir, { recursive: true, force: true });
console.log(`prerender: injected ${html.length} chars into dist/index.html`);
