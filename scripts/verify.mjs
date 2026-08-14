import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
let failures = 0;
const fail = (msg) => { failures++; console.error(`✗ ${msg}`); };
const ok = (msg) => console.log(`✓ ${msg}`);

const walk = (dir) => readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);

// Routes and their required content. Pages tasks append entries here.
export const ROUTES = {
  '/': { h1: null, descIncludes: null },
};

const routeFile = (r) => r === '/' ? join(DIST, 'index.html') : join(DIST, r.slice(1), 'index.html');

for (const [route, req] of Object.entries(ROUTES)) {
  const f = routeFile(route);
  if (!existsSync(f)) { fail(`${route}: ${f} missing`); continue; }
  const html = readFileSync(f, 'utf8');
  const bytes = statSync(f).size;

  if (bytes > 15_000) fail(`${route}: HTML ${bytes}B exceeds 15KB budget`); else ok(`${route}: HTML ${bytes}B`);
  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) fail(`${route}: ${h1s.length} <h1> elements (need exactly 1)`);
  if (req.h1 && !html.includes(req.h1)) fail(`${route}: h1 text "${req.h1}" not found`);
  if (!/<meta name="description" content=".{50,}"/.test(html)) fail(`${route}: meta description missing or too short`);
  if (req.descIncludes && !html.includes(req.descIncludes)) fail(`${route}: description must include "${req.descIncludes}"`);
  if (!html.includes('<link rel="canonical"')) fail(`${route}: canonical missing`);
  if (!html.includes('og:title')) fail(`${route}: og:title missing`);
  if (/<img(?![^>]*alt=")[^>]*>/.test(html)) fail(`${route}: img without alt`);
  if (/<img[^>]*alt=""/.test(html)) fail(`${route}: empty alt attribute`);
}

// Budgets across dist
const files = walk(DIST);
const js = files.filter((f) => f.endsWith('.js'));
const jsBytes = js.reduce((n, f) => n + statSync(f).size, 0);
if (jsBytes > 5_000) fail(`JS total ${jsBytes}B exceeds 5KB budget`); else ok(`JS total ${jsBytes}B`);

const fonts = files.filter((f) => /\.(woff2?|otf|ttf)$/.test(f));
if (fonts.length < 2 || fonts.length > 4) fail(`${fonts.length} font files (budget 2–4)`); else ok(`${fonts.length} font files`);

const images = files.filter((f) => /\.(avif|webp|jpe?g|png)$/i.test(f));
const big = images.filter((f) => statSync(f).size > 200_000);
for (const f of big) fail(`image over 200KB: ${f} (${statSync(f).size}B)`);
if (!big.length) ok(`${images.length} images all under 200KB`);

if (!existsSync(join(DIST, '404.html'))) fail('404.html missing');
if (!existsSync(join(DIST, 'robots.txt'))) fail('robots.txt missing');
if (!existsSync(join(DIST, 'sitemap-index.xml'))) fail('sitemap missing');

console.log(failures ? `\n${failures} failure(s)` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
