import { readFile, writeFile, mkdir, copyFile, readdir, rename, realpath, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, dirname, isAbsolute } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = resolve(root, 'dist');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const items = JSON.parse(await readFile(resolve(root, 'artifacts.json'), 'utf8'));
if (!Array.isArray(items)) throw new Error('artifacts.json must contain an array.');
const slugs = new Set();
const pages = [];
const cards = [];
for (const item of items) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || slugs.has(item.slug)) throw new Error(`Invalid or duplicate slug: ${item.slug}`);
  slugs.add(item.slug);
  for (const field of ['title', 'description', 'category', 'format', 'added']) if (typeof item[field] !== 'string' || !item[field].trim()) throw new Error(`Missing ${field}: ${item.slug}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.added)) throw new Error(`Invalid added date: ${item.slug}`);
  if (Boolean(item.file) === Boolean(item.url)) throw new Error(`Choose exactly one file or url: ${item.slug}`);
  let href;
  if (item.file) {
    const source = resolve(root, item.file);
    const sourceRelative = relative(root, source);
    if (!sourceRelative.startsWith('artifacts/') || sourceRelative.split(/[\\/]/).some(part => part.startsWith('.')) || !sourceRelative.endsWith('.html')) throw new Error(`Only explicit HTML files inside artifacts/ may be published: ${item.slug}`);
    const publicRoot = resolve(root, 'artifacts');
    if ((await lstat(publicRoot)).isSymbolicLink()) throw new Error('artifacts/ must be a real public-source directory.');
    const publicRelative = relative(await realpath(publicRoot), await realpath(source));
    if (publicRelative.startsWith('..') || isAbsolute(publicRelative)) throw new Error(`Public HTML must not link outside artifacts/: ${item.slug}`);
    const original = await readFile(source, 'utf8');
    if (!original.includes('</body>')) throw new Error(`Missing closing body: ${item.slug}`);
    const backLink = '<nav aria-label="返回索引与源码" style="max-width:46rem;margin:0 auto;padding:0 1.25rem 2rem;font:13px/1.6 system-ui,sans-serif"><a href="/" style="color:inherit;text-decoration:underline;text-underline-offset:4px">← 返回 Artifacts 索引</a><p>© 2026 alterxyz · AGPL-3.0-or-later · 无担保 · <a href="https://github.com/alterxyz/my-artifact" style="color:inherit">源码与商业授权</a></p></nav>';
    pages.push({ path: `artifacts/${item.slug}/index.html`, content: original.replace('</body>', `${backLink}\n</body>`) });
    href = `/artifacts/${item.slug}/`;
  } else {
    const target = new URL(item.url);
    if (!['https:', 'http:'].includes(target.protocol)) throw new Error(`External artifacts need an HTTP(S) URL: ${item.slug}`);
    href = target.href;
  }
  const preview = item.slug === 'psychoactive-substances'
    ? `<span class="preview-caption">A THOUGHT EXPERIMENT</span><div class="ladder" aria-hidden="true">${['#cfe6d8','#a9d3be','#e9d8a6','#e7b87e','#e3a07a','#c8674f','#9b5c8c','#6e1e3a'].map((color, index) => `<span style="--step:${color};--height:${36 + index * 15}px"></span>`).join('')}</div><div class="preview-foot"><span>从零开始，重新分级</span><span>01 — 08</span></div>`
    : `<span class="preview-caption">${escape(item.category)}</span><span style="font:72px Georgia,serif;opacity:.45" aria-hidden="true">↗</span><div class="preview-foot"><span>${escape(item.format)}</span><span>ARTIFACT</span></div>`;
  cards.push({ added: item.added, index: cards.length, html: `<a class="work" href="${escape(href)}"${item.url ? ' rel="noopener noreferrer"' : ''}><div class="preview">${preview}</div><div class="work-content"><div class="work-meta"><span class="category">${escape(item.category)}</span><time datetime="${escape(item.added)}">${escape(item.added.replaceAll('-', '.'))}</time></div><h3>${escape(item.title)}</h3><p class="work-description">${escape(item.description)}</p><div class="work-bottom"><span class="format">${escape(item.format)}${item.url ? ' · 外部页面' : ' · HTML'}</span><span class="open-link">打开作品 <span class="open-arrow" aria-hidden="true">↗</span></span></div></div></a>` });
}
// Newest collection date first; later manifest entries win same-day ties.
const orderedCards = cards.sort((a, b) => b.added.localeCompare(a.added) || b.index - a.index);
const template = await readFile(resolve(root, 'site/index.html'), 'utf8');
pages.push({ path: 'index.html', content: template.replace('{{COUNT}}', String(items.length).padStart(2, '0')).replace('{{ARTIFACTS}}', orderedCards.map(card => card.html).join('\n')) });
const assetNames = ['style.css', 'favicon.svg', '404.html'];
const expected = new Set([...pages.map(page => page.path), ...assetNames, '_headers', 'robots.txt', 'sitemap.xml']);
// Publish only the current allowlist. Preserve stale generated output locally,
// so removing a manifest entry cannot accidentally republish its old page.
async function existingFiles(directory, prefix = '') {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const name = prefix + entry.name;
      if (entry.isDirectory()) files.push(...await existingFiles(resolve(directory, entry.name), name + '/'));
      else files.push(name);
    }
    return files;
  } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
const stale = (await existingFiles(out)).filter(file => !expected.has(file));
if (stale.length) {
  const archiveRoot = resolve(root, '.local/stale-builds');
  await mkdir(archiveRoot, { recursive: true });
  const destination = resolve(archiveRoot, `${Date.now()}-${process.pid}`);
  await rename(out, destination);
  console.log(`Previous generated output retained locally; ${stale.length} stale file(s) excluded from this build.`);
}
await mkdir(out, { recursive: true });
for (const page of pages) {
  const destination = resolve(out, page.path);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, page.content);
}
for (const name of assetNames) await copyFile(resolve(root, 'site', name), resolve(out, name));
await writeFile(resolve(out, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n');
await writeFile(resolve(out, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://artifact.alterxyz.com/sitemap.xml\n');
await writeFile(resolve(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://artifact.alterxyz.com/</loc></url>${items.filter(item => item.file).map(item => `<url><loc>https://artifact.alterxyz.com/artifacts/${item.slug}/</loc></url>`).join('')}</urlset>\n`);
console.log(`Built ${items.length} artifact(s); ${expected.size} public files in dist/.`);
