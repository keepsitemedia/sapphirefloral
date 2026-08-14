import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
let failures = 0;
const fail = (msg) => { failures++; console.error(`✗ ${msg}`); };
const ok = (msg) => console.log(`✓ ${msg}`);

const walk = (dir) => readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);

// Routes and their required content. Pages tasks append entries here.
// `bytes` overrides the default 15KB HTML budget for that route.
export const ROUTES = {
  '/': { h1: 'florals for', descIncludes: 'Bozeman' },
  '/about': { h1: 'About Beka', descIncludes: 'Ph.D.' },
  // Beka adds photos to the gallery through the CMS and each one costs ~450B
  // of markup. A flat 15KB would make her own uploads break the build.
  '/portfolio': { h1: 'Portfolio', descIncludes: 'Montana', bytes: 22_000 },
  '/weddings': { h1: 'Wedding flowers', descIncludes: '4,000' },
  '/contact': { h1: "I'd love to be your florist", descIncludes: 'booking' },
};

const routeFile = (r) => r === '/' ? join(DIST, 'index.html') : join(DIST, r.slice(1), 'index.html');

for (const [route, req] of Object.entries(ROUTES)) {
  const f = routeFile(route);
  if (!existsSync(f)) { fail(`${route}: ${f} missing`); continue; }
  const html = readFileSync(f, 'utf8');
  const bytes = statSync(f).size;

  const budget = req.bytes ?? 15_000;
  if (bytes > budget) fail(`${route}: HTML ${bytes}B exceeds ${budget}B budget`); else ok(`${route}: HTML ${bytes}B`);
  // Astro escapes apostrophes and ampersands in text, so copy assertions are
  // written plainly and compared against the decoded HTML.
  const text = html.replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) fail(`${route}: ${h1s.length} <h1> elements (need exactly 1)`);
  if (req.h1 && !text.includes(req.h1)) fail(`${route}: h1 text "${req.h1}" not found`);
  if (!/<meta name="description" content=".{50,}"/.test(html)) fail(`${route}: meta description missing or too short`);
  if (req.descIncludes && !text.includes(req.descIncludes)) fail(`${route}: description must include "${req.descIncludes}"`);
  if (!html.includes('<link rel="canonical"')) fail(`${route}: canonical missing`);
  if (!html.includes('og:title')) fail(`${route}: og:title missing`);
  if (/<img(?![^>]*alt=")[^>]*>/.test(html)) fail(`${route}: img without alt`);
  if (/<img[^>]*alt=""/.test(html)) fail(`${route}: empty alt attribute`);
}

// Per-route content checks. Read through this helper so a missing route is a
// reported failure rather than an ENOENT that skips every remaining check.
const routeHtml = (r) => existsSync(routeFile(r)) ? readFileSync(routeFile(r), 'utf8') : '';

const wed = routeHtml('/weddings');
if (!wed.includes('FAQPage')) fail('/weddings: FAQPage JSON-LD missing');
if (!wed.includes('<table')) fail('/weddings: pricing table missing');
if (!wed.includes('Missoula')) fail('/weddings: travel section missing cities');

const contact = routeHtml('/contact');
if (!contact.includes('data-netlify="true"')) fail('/contact: Netlify form attribute missing');
if (!contact.includes('netlify-honeypot')) fail('/contact: honeypot missing');
if ((contact.match(/<label/g) ?? []).length < 10) fail('/contact: labels missing');
const ty = routeHtml('/thank-you');
if (!ty.includes('noindex')) fail('/thank-you: noindex missing');

// Budgets across dist
const files = walk(DIST);
// Astro inlines small scripts straight into the HTML, so counting dist/**/*.js
// alone reports 0B and the budget never bites. The budget is what one visitor
// downloads: every bundle, plus the inline scripts on the heaviest single page.
const bundledJs = files.filter((f) => f.endsWith('.js'))
  .reduce((n, f) => n + statSync(f).size, 0);
const inlineJs = files.filter((f) => f.endsWith('.html'))
  .map((f) => [...readFileSync(f, 'utf8')
    .matchAll(/<script\b(?![^>]*\btype="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)]
    .reduce((n, m) => n + Buffer.byteLength(m[1]), 0));
const jsBytes = bundledJs + Math.max(0, ...inlineJs);
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
