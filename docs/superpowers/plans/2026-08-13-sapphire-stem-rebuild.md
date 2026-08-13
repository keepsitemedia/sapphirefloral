# Sapphire Stem Floral Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild sapphirestemfloral.com as a static Astro 5 site on Netlify with Decap CMS (DecapBridge auth), an inquiry form, and complete local SEO.

**Architecture:** Fully static Astro site, zero client JS except a ≤2 KB nav toggle and ≤2 KB portfolio lightbox. All copy in typed content collections; Decap exposes only portfolio, à la carte prices, and the booking banner. Verification is a post-build assertion script (`scripts/verify.mjs`) that greps `dist/` for SEO invariants and enforces byte budgets — it is the test suite, written first per task.

**Tech Stack:** Astro ^5, @astrojs/sitemap, @fontsource-variable/fraunces, @fontsource-variable/karla, sharp (build-time only), Decap CMS 3 (CDN script), Netlify Forms, Netlify static hosting.

**Spec:** `docs/superpowers/specs/2026-08-13-sapphire-stem-floral-rebuild-design.md`

## Global Constraints

- Performance budget (hard gates, enforced by `scripts/verify.mjs`): HTML < 15 KB per route; total JS < 5 KB; 2–4 font files / 2 families; largest image < 200 KB; total first load < 400 KB.
- All text server-rendered; every route fully readable with JS disabled.
- URLs unchanged from current site: `/`, `/about`, `/portfolio`, `/weddings`, `/contact`; plus `/thank-you` (noindex) and `/404`.
- Exactly one `<h1>` per page; heading levels never skip.
- Every image: required non-empty `alt`, explicit `width`/`height`, `loading="lazy"` unless above the fold.
- Phone number, email, cities defined once in `src/data/site.ts`, imported everywhere. Phone: `(406) 219-1116` (pending Beka's confirmation — single swap point).
- Positioning: "Montana wedding florist" leading, Big Timber as base; travel cities: Bozeman, Big Sky, Livingston, Billings, Butte, Missoula.
- Site URL: `https://sapphirestemfloral.com`.
- Node ≥ 20. Repo root = project root (docs/ already present).
- Copy is Beka's verbatim where extracted (spelling corrected: "palette", "accommodate"); em-dash mojibake fixed.
- Commit after every task with the trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Scaffold, tokens, fonts, verify harness

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `netlify.toml`, `public/robots.txt`, `src/styles/tokens.css`, `src/styles/base.css`, `scripts/verify.mjs`
- Test: `scripts/verify.mjs` (run against `dist/`)

**Interfaces:**
- Produces: `npm run build` → `dist/`; `npm run verify` → runs build assertions; CSS custom properties (`--ink`, `--ground`, `--accent`, `--accent-deep`, `--sage`, `--line`, `--display`, `--body`, spacing `--s1..--s6`) used by every later component.

- [ ] **Step 1: Write package.json**

```json
{
  "name": "sapphire-stem-floral",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "verify": "npm run build && node scripts/verify.mjs"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.2.0",
    "@fontsource-variable/fraunces": "^5.1.0",
    "@fontsource-variable/karla": "^5.1.0",
    "astro": "^5.0.0",
    "sharp": "^0.33.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Install and pin**

Run: `npm install`
Expected: lockfile created, no errors. (WSL on `/mnt/c` is slow; give it time.)

- [ ] **Step 3: Write astro.config.mjs**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://sapphirestemfloral.com',
  trailingSlash: 'never',
  integrations: [
    sitemap({ filter: (page) => !page.includes('/thank-you') }),
  ],
});
```

- [ ] **Step 4: Write tsconfig.json, .gitignore, netlify.toml, robots.txt**

`tsconfig.json`:
```json
{ "extends": "astro/tsconfigs/strict", "include": [".astro/types.d.ts", "src/**/*"], "exclude": ["dist"] }
```

`.gitignore`:
```
node_modules/
dist/
.astro/
originals/
```

`netlify.toml`:
```toml
[build]
  command = "npm run verify"
  publish = "dist"

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```
(Build command is `verify`, not `build` — the budget gates run on every deploy.)

`public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://sapphirestemfloral.com/sitemap-index.xml
```

- [ ] **Step 5: Write src/styles/tokens.css**

Palette: light botanical ground with sapphire accent — spirit of the current site, chosen not inherited.

```css
:root {
  --ground: #faf9f6;
  --surface: #ffffff;
  --ink: #21272b;
  --ink-soft: #4c565c;
  --muted: #77828a;
  --line: #e3e1da;
  --accent: #2f4d7e;      /* Yogo sapphire */
  --accent-soft: #eaeef5;
  --sage: #77835f;
  --sage-soft: #eef0e8;

  --display: 'Fraunces Variable', Georgia, serif;
  --body: 'Karla Variable', 'Segoe UI', system-ui, sans-serif;

  --s1: 0.5rem; --s2: 0.85rem; --s3: 1.35rem;
  --s4: 2.2rem; --s5: 3.5rem; --s6: 5.5rem;
  --measure: 62ch;
}
```

- [ ] **Step 6: Write src/styles/base.css**

```css
*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: var(--body);
  font-size: 1.0625rem;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 {
  font-family: var(--display);
  font-weight: 420;
  line-height: 1.12;
  letter-spacing: -0.01em;
  text-wrap: balance;
  margin: 0;
}
h1 { font-size: clamp(2.2rem, 6vw, 3.4rem); }
h2 { font-size: clamp(1.6rem, 4vw, 2.2rem); }
h3 { font-size: 1.25rem; }
p { margin: 0; max-width: var(--measure); }
img { max-width: 100%; height: auto; display: block; }
a { color: var(--accent); text-underline-offset: 3px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.eyebrow {
  font-size: 0.78rem; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--accent); font-weight: 700;
}
.btn {
  display: inline-block; background: var(--accent); color: #fff;
  padding: 0.8rem 1.6rem; border-radius: 2px; text-decoration: none;
  font-weight: 700; letter-spacing: 0.02em;
}
.btn:hover { background: #263f68; }
.wrap { max-width: 72rem; margin-inline: auto; padding-inline: var(--s3); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
```

- [ ] **Step 7: Write the failing verify harness**

`scripts/verify.mjs`:
```js
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

if (!existsSync(join(DIST, 'robots.txt'))) fail('robots.txt missing');
if (!existsSync(join(DIST, 'sitemap-index.xml'))) fail('sitemap missing');

console.log(failures ? `\n${failures} failure(s)` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
```

- [ ] **Step 8: Run verify to confirm it fails**

Run: `npm run verify`
Expected: FAIL — build succeeds but `dist/index.html` missing (no pages yet). This is the red state.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "Scaffold Astro project with token system and verify harness"
```

---

### Task 2: Site constants and content collections

**Files:**
- Create: `src/data/site.ts`, `src/content.config.ts`, `src/content/pages/home.md`, `src/content/pages/about.md`, `src/content/pages/weddings.md`, `src/content/pages/contact.md`, `src/content/data/alacarte.json`, `src/content/data/settings.json`
- Test: `npm run check` (Zod schema enforcement)

**Interfaces:**
- Produces: `SITE` object `{ name, tagline, phone, phoneHref, email, instagram, instagramUrl, facebook, facebookUrl, base, cities: string[] }`; collections `pages` (frontmatter `title`, `seoTitle`, `description`), `portfolio` (schema below, empty until Task 3), `alacarte` (id `alacarte`, `items[]`), `settings` (id `settings`, `bookingBanner`). Later tasks import via `getCollection`/`getEntry` and `import { SITE } from '../data/site'`.

- [ ] **Step 1: Write src/data/site.ts**

```ts
export const SITE = {
  name: 'Sapphire Stem Floral Design',
  tagline: 'Environmentally-conscious, artful, romantic, and fun florals',
  phone: '(406) 219-1116', // pending Beka's confirmation — single swap point
  phoneHref: 'tel:+14062191116',
  email: 'sapphirestemfloral@gmail.com',
  instagram: '@sapphirestemfloral',
  instagramUrl: 'https://www.instagram.com/sapphirestemfloral',
  facebook: 'Sapphire Stem Floral Design',
  facebookUrl: 'https://www.facebook.com/people/Sapphire-Stem-Floral-Design/61587076468237/',
  base: 'Big Timber, Montana',
  cities: ['Big Timber', 'Bozeman', 'Big Sky', 'Livingston', 'Billings', 'Butte', 'Missoula'],
} as const;
```

- [ ] **Step 2: Write src/content.config.ts**

```ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().max(70),
    description: z.string().min(80).max(170),
  }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/portfolio' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    image: image(),
    alt: z.string().min(1, 'alt text is required — build fails without it'),
    credit: z.string().optional(),
    category: z.enum(['wedding', 'event', 'personals', 'installation']),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

const alacarte = defineCollection({
  loader: file('./src/content/data/alacarte.json'),
  schema: z.object({
    id: z.string(),
    items: z.array(z.object({
      category: z.enum(['personals', 'ceremony', 'reception']),
      name: z.string(),
      startingAt: z.number().positive(),
      note: z.string().optional(),
      order: z.number().default(0),
    })),
  }),
});

const settings = defineCollection({
  loader: file('./src/content/data/settings.json'),
  schema: z.object({ id: z.string(), bookingBanner: z.string() }),
});

export const collections = { pages, portfolio, alacarte, settings };
```

- [ ] **Step 3: Write alacarte.json (recovered prices — Beka confirms before launch)**

```json
[
  {
    "id": "alacarte",
    "items": [
      { "category": "personals", "name": "Bridal bouquet", "startingAt": 250, "order": 1 },
      { "category": "personals", "name": "Bridesmaid bouquet", "startingAt": 75, "order": 2 },
      { "category": "personals", "name": "Boutonniere", "startingAt": 25, "order": 3 },
      { "category": "personals", "name": "Pocket square", "startingAt": 35, "order": 4 },
      { "category": "personals", "name": "Corsage", "startingAt": 45, "order": 5 },
      { "category": "ceremony", "name": "Aisle marker", "startingAt": 250, "order": 1 },
      { "category": "ceremony", "name": "Arch accent flowers", "startingAt": 350, "order": 2 },
      { "category": "ceremony", "name": "Pedestal arrangement", "startingAt": 500, "order": 3 },
      { "category": "ceremony", "name": "Meadow semi circle", "startingAt": 1500, "order": 4 },
      { "category": "ceremony", "name": "Full arch", "startingAt": 2500, "order": 5 },
      { "category": "reception", "name": "Bud vases", "startingAt": 10, "order": 1 },
      { "category": "reception", "name": "Petite centerpiece", "startingAt": 50, "order": 2 },
      { "category": "reception", "name": "Signature centerpiece", "startingAt": 175, "order": 3 },
      { "category": "reception", "name": "Long and low centerpiece", "startingAt": 250, "order": 4 },
      { "category": "reception", "name": "Bar arrangement", "startingAt": 300, "order": 5 },
      { "category": "reception", "name": "Table garland", "startingAt": 40, "order": 6 },
      { "category": "reception", "name": "Cake flowers", "startingAt": 40, "order": 7 }
    ]
  }
]
```

`settings.json`:
```json
[{ "id": "settings", "bookingBanner": "Now booking 2026 & 2027 weddings and events" }]
```

- [ ] **Step 4: Write the four page markdown files**

`home.md` — frontmatter + Beka's verbatim pillars:
```markdown
---
title: Montana Wedding Florist
seoTitle: Montana Wedding Florist — Sapphire Stem Floral Design
description: Environmentally-conscious wedding and event florals, based in Big Timber and traveling to Bozeman, Big Sky, Livingston, Billings, Butte, and Missoula.
---

## Why Sapphire Stem?

### We create impactful florals that feel like you.

Every design is uniquely tailored to you and your story. We source impactful, gorgeous blooms that elevate your wedding or event all while radiating your personality and style.

### We care about our environmental impact.

Our designs are foam-free wherever possible and we prioritize avoiding single use plastics. Flowers are sourced locally when in season, and when out of season, they are sourced from wholesalers who value sustainability.

### We work with your budget.

We understand not everyone has an unlimited budget for flowers. We offer thoughtful substitutions and creative design solutions to focus on the moments that will have the greatest impact on your day.
```

`about.md` — Beka's full story, verbatim (mojibake fixed):
```markdown
---
title: About Beka
seoTitle: About Beka Greenall — Sapphire Stem Floral Design
description: Beka Greenall holds a Ph.D. in biology and founded Sapphire Stem Floral Design in 2025 — environmentally-conscious wedding florals from Big Timber, Montana.
---

My name is Beka and I believe everyone should be able to experience the beauty and joy of flowers.

My background is in science; I hold a B.S. and Ph.D. in biology. I have published scientific papers and conducted studies in education research, conservation, and geomapping. So why am I a florist, you ask? Because flowers make me light up. Flowers feel like home to me.

Growing up just outside of Bozeman, I was immersed in the natural world from a young age, drawn outdoors and inspired to protect and appreciate its grandeur. Studying in Hawaiʻi further deepened my connection with flowers and solidified my need to be around them.

Although I didn't start out as a florist, I believe flowers have always been there, grounding me and giving me a sense of belonging along the way. Every important life event I can recall is rooted with flowers. From graduations to my wedding day to the birth of my son, I can still remember the flowers that surrounded me. That is what flowers do to people, they root us in the natural world, hold memory and meaning, and remind us — again and again — that we belong.

## Why "Sapphire Stem"?

Flowers hold deep meaning and mark the seasons of our lives. When naming my floral business, I wanted something just as intentional and memorable. Sapphire is a tribute to Montana, my home state — Montana sapphires have long symbolized the Treasure State for me.
```
(The naming paragraph was truncated in the source extraction; the last sentence ends at a natural boundary of the recovered text. Flag in HANDOFF.md for Beka to extend if she wants the engagement-ring detail restored.)

`weddings.md` — verbatim policy copy, spelling corrected:
```markdown
---
title: Wedding Flowers
seoTitle: Wedding Flowers & À La Carte Pricing — Montana
description: À la carte wedding flowers from $10 and full-service floral design from $4,000. Based in Big Timber, serving Bozeman, Big Sky, Billings, Butte, and Missoula.
---

Every wedding is unique, and pricing varies based on style, season, location, and floral needs.

This à la carte menu is perfect for couples who want gorgeous arrangements made with the freshest seasonal blooms without the complexity of fully customized planning.

## How it works

1. After we connect, you send me your wedding color palette, a few design styles you like, and any flower requests.
2. I design your arrangements using the freshest available seasonal flowers and accommodate your requests to the best of my ability.
3. You pick up your order in Big Timber, MT on the weekday of your choice.

## Full service weddings

A full service wedding is designed for couples who want to be more hands-on throughout the planning process and want to experience fully customized, gorgeous wedding flowers that have been meticulously tailored to honor them and their story.

A full service wedding includes detailed design proposals, multiple consultations to ensure your vision is coming to life, and the complete delivery, setup, styling, and cleanup of your flowers. This is helpful for couples who don't want to have to worry about a thing on their wedding day, apart from getting married of course!

Full service weddings begin at $4,000 and include custom designs, detailed proposals, delivery, installation, on-site styling, and cleanup.
```

`contact.md`:
```markdown
---
title: I'd love to be your florist
seoTitle: Inquire — Sapphire Stem Floral Design
description: Tell us about your wedding or event. Sapphire Stem Floral Design creates artful, sustainable florals across Montana — now booking 2026 and 2027.
---

Fill out the form below and I'll get back to you within a few days. Prefer email? Reach me any time at sapphirestemfloral@gmail.com.
```

- [ ] **Step 5: Verify schemas catch bad content**

Run: `npm run check`
Expected: PASS. Then temporarily set one alacarte `startingAt` to `-5`, run again — expected FAIL with Zod error. Revert.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Add site constants, content collections, and page copy"
```

---

### Task 3: Image harvest and portfolio entries

**Files:**
- Create: `scripts/harvest.mjs`, `src/assets/portfolio/*.jpg` (curated ~16), `src/assets/site/hero.jpg`, `src/content/portfolio/*.md` (one per curated image)
- Staging (gitignored): `originals/`

**Interfaces:**
- Produces: populated `portfolio` collection consumed by Tasks 5 and 7; `src/assets/site/hero.jpg` consumed by Task 5.

- [ ] **Step 1: Write scripts/harvest.mjs (downloads + dimension report)**

```js
// One-time harvest of media from the live Canva export.
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import sharp from 'sharp';

mkdirSync('originals', { recursive: true });
execSync('curl -sL https://sapphirestemfloral.com/ -o originals/_home.html');
const html = readFileSync('originals/_home.html', 'utf8');
const urls = [...new Set(html.match(/_assets\/media\/[a-f0-9]+\.(?:jpg|png)/g))];
console.log(`${urls.length} media files`);
for (const u of urls) {
  const name = u.split('/').pop();
  execSync(`curl -sL "https://sapphirestemfloral.com/${u}" -o "originals/${name}"`);
}
const rows = [];
for (const f of readdirSync('originals').filter((f) => /\.(jpg|png)$/.test(f))) {
  const m = await sharp(`originals/${f}`).metadata();
  rows.push(`${f}\t${m.width}x${m.height}\t${Math.round(m.size ?? 0)}`);
}
writeFileSync('originals/_report.tsv', rows.join('\n'));
console.log('report written to originals/_report.tsv');
```

- [ ] **Step 2: Run the harvest**

Run: `node scripts/harvest.mjs`
Expected: ~144 files in `originals/`, report written.

- [ ] **Step 3: Cull to a curated set**

From `_report.tsv`, discard images under 900 px on the long edge (UI chrome, icons, mockup PNGs). **View each remaining candidate with the Read tool.** Select ~16 that are real floral/wedding photography (mix of bouquets, installations, table settings; avoid duplicates and text-bearing mockups). Copy the strongest wide landscape shot to `src/assets/site/hero.jpg`; copy the rest to `src/assets/portfolio/` with descriptive kebab-case names (e.g. `arch-installation-river.jpg`, not the Canva hash).

- [ ] **Step 4: Write one portfolio entry per curated image**

**Alt text is written by looking at the image, not from the filename.** Format, one file per image, e.g. `src/content/portfolio/arch-installation-river.md`:

```markdown
---
title: Riverside arch installation
image: ../../assets/portfolio/arch-installation-river.jpg
alt: Asymmetrical floral arch of white and blush garden roses framing a riverside ceremony site
credit: Cinema by Alle
category: wedding
featured: true
order: 1
---
```

Credit assignment: the site credits Kindzerski Photography, Cinema by Alle, John Scott Bly, and Job Greenall but doesn't map photos to photographers. Leave `credit` off any image you can't attribute; add a HANDOFF.md item for Beka to fill credits in via the CMS. Mark 4–6 entries `featured: true` for the homepage.

- [ ] **Step 5: Verify build processes images**

Run: `npm run check && npm run build`
Expected: PASS; `dist/_astro/` contains generated `.webp`/`.avif` variants. (Route/budget failures from verify are expected until Task 4+ — run plain `build`, not `verify`, here.)

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Harvest and curate portfolio images with alt text"
```

---

### Task 4: Base layout, SEO, header, footer, schema, 404

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/SEO.astro`, `src/components/Schema.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/Cta.astro`, `src/pages/404.astro`
- Modify: `scripts/verify.mjs` (activate route table for `/404.html` presence only)

**Interfaces:**
- Consumes: `SITE`, tokens, settings collection (`bookingBanner`).
- Produces: `<Base title description ogImage?>` slot layout used by every page; `<Cta heading?>` closing-CTA block; Schema emits `Florist` JSON-LD on every page. Header nav: Portfolio, Weddings, About, Contact + `.btn` Inquire → `/contact`. Footer: phone, email, IG, FB, service-area line, © year.

- [ ] **Step 1: Write SEO.astro**

```astro
---
interface Props { title: string; description: string; ogImage?: string }
const { title, description, ogImage = '/og-default.jpg' } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:type" content="website" />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={new URL(ogImage, Astro.site)} />
<meta name="twitter:card" content="summary_large_image" />
```

- [ ] **Step 2: Write Schema.astro (Florist JSON-LD, service-area business)**

```astro
---
import { SITE } from '../data/site';
const schema = {
  '@context': 'https://schema.org',
  '@type': 'Florist',
  name: SITE.name,
  telephone: SITE.phone,
  email: SITE.email,
  url: 'https://sapphirestemfloral.com',
  foundingDate: '2025',
  priceRange: '$$',
  founder: { '@type': 'Person', name: 'Beka Greenall' },
  areaServed: [
    ...SITE.cities.map((c) => ({ '@type': 'City', name: `${c}, MT` })),
    { '@type': 'AdministrativeArea', name: 'Southwest Montana' },
  ],
  sameAs: [SITE.instagramUrl, SITE.facebookUrl],
};
---
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

- [ ] **Step 3: Write Header.astro (with ≤2KB nav toggle)**

```astro
---
import { getEntry } from 'astro:content';
const settings = await getEntry('settings', 'settings');
const nav = [
  ['/portfolio', 'Portfolio'], ['/weddings', 'Weddings'],
  ['/about', 'About'], ['/contact', 'Contact'],
];
const path = Astro.url.pathname.replace(/\/$/, '') || '/';
---
<p class="banner">{settings!.data.bookingBanner}</p>
<header class="wrap site-head">
  <a class="brand" href="/">Sapphire Stem <span>floral design</span></a>
  <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>
  <nav id="site-nav" aria-label="Main">
    <ul>
      {nav.map(([href, label]) => (
        <li><a href={href} aria-current={path === href ? 'page' : undefined}>{label}</a></li>
      ))}
      <li><a class="btn" href="/contact">Inquire</a></li>
    </ul>
  </nav>
</header>
<style>
  .banner { background: var(--accent); color: #fff; text-align: center;
    font-size: 0.8rem; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 0.45rem var(--s2); max-width: none; }
  .site-head { display: flex; align-items: center; justify-content: space-between;
    gap: var(--s3); padding-block: var(--s3); }
  .brand { font-family: var(--display); font-size: 1.35rem; color: var(--ink);
    text-decoration: none; line-height: 1.05; }
  .brand span { display: block; font-size: 0.72rem; font-family: var(--body);
    letter-spacing: 0.28em; text-transform: uppercase; color: var(--muted); }
  nav ul { display: flex; align-items: center; gap: var(--s3); list-style: none;
    margin: 0; padding: 0; }
  nav a:not(.btn) { color: var(--ink-soft); text-decoration: none; }
  nav a[aria-current="page"] { color: var(--accent); font-weight: 700; }
  .nav-toggle { display: none; }
  @media (max-width: 46rem) {
    .nav-toggle { display: block; background: none; border: 1px solid var(--line);
      padding: 0.4rem 0.9rem; font: inherit; cursor: pointer; }
    nav { display: none; width: 100%; }
    nav.open { display: block; }
    nav ul { flex-direction: column; align-items: flex-start; padding-block: var(--s2); }
    .site-head { flex-wrap: wrap; }
  }
</style>
<script>
  const btn = document.querySelector('.nav-toggle')!;
  const nav = document.getElementById('site-nav')!;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
</script>
```

- [ ] **Step 4: Write Footer.astro, Cta.astro, Base.astro**

`Footer.astro`:
```astro
---
import { SITE } from '../data/site';
const year = new Date().getFullYear();
---
<footer>
  <div class="wrap cols">
    <div>
      <p class="eyebrow">Studio</p>
      <p>Based in {SITE.base}, traveling to {SITE.cities.slice(1).join(', ')} and beyond.</p>
    </div>
    <div>
      <p class="eyebrow">Contact</p>
      <p><a href={SITE.phoneHref}>{SITE.phone}</a><br /><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
    </div>
    <div>
      <p class="eyebrow">Follow</p>
      <p><a href={SITE.instagramUrl}>Instagram {SITE.instagram}</a><br /><a href={SITE.facebookUrl}>Facebook</a></p>
    </div>
  </div>
  <p class="wrap fine">© {SITE.name} {year} · Big Timber &amp; Southwest Montana</p>
</footer>
<style>
  footer { border-top: 1px solid var(--line); margin-top: var(--s6);
    padding-block: var(--s4); background: var(--surface); }
  .cols { display: grid; gap: var(--s3); grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }
  .fine { color: var(--muted); font-size: 0.85rem; padding-top: var(--s4); max-width: none; }
  footer a { color: var(--ink-soft); }
</style>
```

`Cta.astro`:
```astro
---
interface Props { heading?: string }
const { heading = "Let's design your day" } = Astro.props;
---
<section class="wrap cta">
  <h2>{heading}</h2>
  <p>Tell me about your wedding or event — I'd love to be your florist.</p>
  <a class="btn" href="/contact">Start an inquiry</a>
</section>
<style>
  .cta { text-align: center; padding-block: var(--s5);
    display: flex; flex-direction: column; align-items: center; gap: var(--s3); }
</style>
```

`Base.astro`:
```astro
---
import '@fontsource-variable/fraunces';
import '@fontsource-variable/karla';
import '../styles/tokens.css';
import '../styles/base.css';
import SEO from '../components/SEO.astro';
import Schema from '../components/Schema.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
interface Props { title: string; description: string; ogImage?: string; noindex?: boolean }
const { title, description, ogImage, noindex } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <SEO {title} {description} {ogImage} />
    {noindex && <meta name="robots" content="noindex" />}
    <Schema />
  </head>
  <body>
    <Header />
    <main id="main"><slot /></main>
    <Footer />
  </body>
</html>
```

Font-file budget: fontsource variable imports pull one woff2 per family per subset; keep only latin by importing `@fontsource-variable/fraunces/index.css` defaults and confirming with `npm run verify` (2–4 file gate) in Task 5.

- [ ] **Step 5: Write 404.astro**

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Page not found — Sapphire Stem Floral Design" description="That page has wilted. Browse the portfolio or get in touch — Sapphire Stem Floral Design, Montana wedding florist." noindex>
  <section class="wrap" style="padding-block: var(--s6); text-align: center;">
    <h1>That page has wilted</h1>
    <p style="margin-inline: auto; padding-block: var(--s3);">The page you're looking for doesn't exist. The flowers, however, are right this way.</p>
    <a class="btn" href="/portfolio">See the portfolio</a>
  </section>
</Base>
```

- [ ] **Step 6: Build and inspect**

Run: `npm run build && ls dist`
Expected: `404.html` present, no build errors. Full verify still red (no `/` yet) — correct at this stage.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "Add base layout, SEO/schema components, header, footer, 404"
```

---

### Task 5: Home page

**Files:**
- Create: `src/pages/index.astro`
- Modify: `scripts/verify.mjs` — ROUTES entry for `/`

**Interfaces:**
- Consumes: `Base`, `Cta`, pages/home, portfolio `featured`, `src/assets/site/hero.jpg`.

- [ ] **Step 1: Add the failing assertion**

In `scripts/verify.mjs` ROUTES:
```js
'/': { h1: 'florals for', descIncludes: 'Bozeman' },
```
Run: `npm run verify` → FAIL (`dist/index.html` missing). Red confirmed.

- [ ] **Step 2: Write index.astro**

```astro
---
import { getCollection, getEntry, render } from 'astro:content';
import { Image } from 'astro:assets';
import Base from '../layouts/Base.astro';
import Cta from '../components/Cta.astro';
import { SITE } from '../data/site';
import hero from '../assets/site/hero.jpg';
const home = await getEntry('pages', 'home');
const { Content } = await render(home!);
const featured = (await getCollection('portfolio', (e) => e.data.featured))
  .sort((a, b) => a.data.order - b.data.order).slice(0, 6);
---
<Base title={home!.data.seoTitle} description={home!.data.description}>
  <section class="wrap hero">
    <div class="hero-copy">
      <p class="eyebrow">Wedding &amp; event florist · {SITE.base}</p>
      <h1>Environmentally-conscious, artful, romantic, and fun florals for Montana.</h1>
      <p>Serving {SITE.cities.join(', ')}, and everywhere in between.</p>
      <a class="btn" href="/contact">Inquire about your date</a>
    </div>
    <Image src={hero} alt="Lush arrangement of garden roses, snapdragons, and seasonal Montana blooms" width={880} widths={[440, 880]} sizes="(max-width: 46rem) 100vw, 50vw" loading="eager" />
  </section>

  <section class="wrap pillars"><Content /></section>

  <section class="wrap">
    <h2>Recent work</h2>
    <ul class="grid">
      {featured.map((e) => (
        <li>
          <Image src={e.data.image} alt={e.data.alt} width={640} widths={[320, 640]} sizes="(max-width: 46rem) 50vw, 33vw" />
        </li>
      ))}
    </ul>
    <a href="/portfolio">See the full portfolio →</a>
  </section>

  <Cta />
</Base>
<style>
  .hero { display: grid; gap: var(--s4); align-items: center;
    grid-template-columns: 1fr 1fr; padding-block: var(--s5); }
  .hero-copy { display: flex; flex-direction: column; gap: var(--s3); align-items: flex-start; }
  .pillars :global(h2) { padding-block: var(--s4) var(--s2); }
  .pillars :global(h3) { padding-block: var(--s3) var(--s1); color: var(--accent); }
  .grid { list-style: none; margin: 0; padding: var(--s3) 0; display: grid;
    gap: var(--s2); grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 46rem) {
    .hero { grid-template-columns: 1fr; }
    .grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
```

- [ ] **Step 3: Run verify to green**

Run: `npm run verify`
Expected: `/` passes all checks including budgets. If the JS gate fails, the culprit is the Header toggle script — Astro inlines it; confirm total stays under 5 KB. If fonts exceed 4 files, switch imports to the single-file `latin` subset css (`@fontsource-variable/fraunces/wght.css`).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "Add home page with hero, pillars, featured work"
```

---

### Task 6: About page

**Files:**
- Create: `src/pages/about.astro`
- Modify: `scripts/verify.mjs`

- [ ] **Step 1: Failing assertion**

```js
'/about': { h1: 'About Beka', descIncludes: 'Ph.D.' },
```
Run: `npm run verify` → FAIL (route missing).

- [ ] **Step 2: Write about.astro**

```astro
---
import { getEntry, render } from 'astro:content';
import Base from '../layouts/Base.astro';
import Cta from '../components/Cta.astro';
const page = await getEntry('pages', 'about');
const { Content } = await render(page!);
---
<Base title={page!.data.seoTitle} description={page!.data.description}>
  <article class="wrap prose">
    <p class="eyebrow">Est. 2025 · Big Timber, Montana</p>
    <h1>About Beka</h1>
    <Content />
  </article>
  <Cta heading="I'd love to be your florist" />
</Base>
<style>
  .prose { padding-block: var(--s5); display: flex; flex-direction: column; gap: var(--s3); }
  .prose :global(h2) { padding-top: var(--s3); }
</style>
```

- [ ] **Step 3: Verify green, commit**

Run: `npm run verify` → PASS.
```bash
git add -A && git commit -m "Add about page"
```

---

### Task 7: Portfolio page with lightbox

**Files:**
- Create: `src/pages/portfolio.astro`
- Modify: `scripts/verify.mjs`

- [ ] **Step 1: Failing assertion**

```js
'/portfolio': { h1: 'Portfolio', descIncludes: 'Montana' },
```
Run: `npm run verify` → FAIL.

- [ ] **Step 2: Write portfolio.astro**

Native `<dialog>` lightbox, no dependency; grid works fully without JS (dialog opens only when JS runs; otherwise links are inert images — no dead ends).

```astro
---
import { getCollection } from 'astro:content';
import { Image } from 'astro:assets';
import Base from '../layouts/Base.astro';
import Cta from '../components/Cta.astro';
const entries = (await getCollection('portfolio'))
  .sort((a, b) => a.data.order - b.data.order);
---
<Base title="Wedding Floral Portfolio — Montana" description="Bouquets, arches, and installations by Sapphire Stem Floral Design. Featured on Montana Bride, with photography by Cinema by Alle and Kindzerski Photography.">
  <section class="wrap">
    <p class="eyebrow">Featured on Montana Bride</p>
    <h1>Portfolio</h1>
    <ul class="grid">
      {entries.map((e, i) => (
        <li>
          <button class="tile" data-idx={i} aria-label={`View larger: ${e.data.title}`}>
            <Image src={e.data.image} alt={e.data.alt} width={640} widths={[320, 640]} sizes="(max-width: 46rem) 50vw, 33vw" />
          </button>
          {e.data.credit && <p class="credit">{e.data.credit}</p>}
        </li>
      ))}
    </ul>
    <p class="credit">Photos by Kindzerski Photography, Cinema by Alle, John Scott Bly, and Job Greenall.</p>
  </section>
  <dialog id="lightbox">
    <button id="lb-close" autofocus>Close</button>
    <div id="lb-body"></div>
  </dialog>
  <Cta />
</Base>
<style>
  .grid { list-style: none; margin: 0; padding: var(--s3) 0; display: grid;
    gap: var(--s2); grid-template-columns: repeat(3, 1fr); }
  .tile { border: 0; padding: 0; background: none; cursor: zoom-in; display: block; width: 100%; }
  .credit { font-size: 0.8rem; color: var(--muted); padding-top: 0.2rem; }
  dialog { border: 0; padding: var(--s2); max-width: min(64rem, 92vw); background: var(--surface); }
  dialog::backdrop { background: rgb(20 25 30 / 0.85); }
  #lb-close { float: right; border: 1px solid var(--line); background: none;
    padding: 0.3rem 0.8rem; cursor: pointer; font: inherit; }
  @media (max-width: 46rem) { .grid { grid-template-columns: repeat(2, 1fr); } }
</style>
<script>
  const dlg = document.getElementById('lightbox') as HTMLDialogElement;
  const body = document.getElementById('lb-body')!;
  document.querySelectorAll<HTMLButtonElement>('.tile').forEach((btn) => {
    btn.addEventListener('click', () => {
      const img = btn.querySelector('img')!.cloneNode(true) as HTMLImageElement;
      img.sizes = '92vw';
      body.replaceChildren(img);
      dlg.showModal();
    });
  });
  document.getElementById('lb-close')!.addEventListener('click', () => dlg.close());
</script>
```

- [ ] **Step 3: Verify green (watch the JS budget), commit**

Run: `npm run verify` → PASS; JS total (nav + lightbox) must stay < 5 KB.
```bash
git add -A && git commit -m "Add portfolio page with dependency-free lightbox"
```

---

### Task 8: Weddings page — pricing table, travel, FAQ

**Files:**
- Create: `src/pages/weddings.astro`, `src/components/AlaCarteTable.astro`
- Modify: `scripts/verify.mjs`

- [ ] **Step 1: Failing assertions**

```js
'/weddings': { h1: 'Wedding flowers', descIncludes: '4,000' },
```
Plus two ad-hoc checks appended after the route loop:
```js
const wed = readFileSync(routeFile('/weddings'), 'utf8');
if (!wed.includes('FAQPage')) fail('/weddings: FAQPage JSON-LD missing');
if (!wed.includes('<table')) fail('/weddings: pricing table missing');
if (!wed.includes('Missoula')) fail('/weddings: travel section missing cities');
```
Run: `npm run verify` → FAIL.

- [ ] **Step 2: Write AlaCarteTable.astro**

```astro
---
import { getEntry } from 'astro:content';
const menu = await getEntry('alacarte', 'alacarte');
const groups = ['personals', 'ceremony', 'reception'] as const;
const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;
---
<table>
  <caption class="eyebrow">À la carte menu — starting prices</caption>
  {groups.map((g) => (
    <tbody>
      <tr><th class="group" colspan="2" scope="colgroup">{g}</th></tr>
      {menu!.data.items.filter((i) => i.category === g)
        .sort((a, b) => a.order - b.order)
        .map((i) => (
          <tr>
            <th scope="row">{i.name}{i.note && <span class="note"> — {i.note}</span>}</th>
            <td>Starting at {fmt(i.startingAt)}</td>
          </tr>
        ))}
    </tbody>
  ))}
</table>
<style>
  table { width: 100%; border-collapse: collapse; }
  caption { text-align: left; padding-block: var(--s2); }
  th, td { text-align: left; padding: 0.55rem 0.4rem; border-bottom: 1px solid var(--line); font-weight: 400; }
  td { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .group { font-family: var(--display); font-size: 1.15rem; color: var(--accent);
    text-transform: capitalize; padding-top: var(--s3); }
  .note { color: var(--muted); font-size: 0.9rem; }
</style>
```

- [ ] **Step 3: Write weddings.astro**

```astro
---
import { getEntry, render } from 'astro:content';
import Base from '../layouts/Base.astro';
import Cta from '../components/Cta.astro';
import AlaCarteTable from '../components/AlaCarteTable.astro';
import { SITE } from '../data/site';
const page = await getEntry('pages', 'weddings');
const { Content } = await render(page!);
const faqs = [
  ['How does the à la carte menu work?', 'After we connect, you send your wedding color palette, styles you like, and any flower requests. I design your arrangements with the freshest seasonal flowers, and you pick up in Big Timber, MT on the weekday of your choice. $100 minimum.'],
  ['Do you deliver and set up?', 'The à la carte menu is designed for pick-up. Delivery and setup is offered for weddings with a floral total of $2,000 or more, starting at $500 plus mileage, subject to availability.'],
  ['How do we reserve our date?', 'A 50% non-refundable retainer secures your date. Once booked, I reserve my time and turn away other couples for that weekend to fully honor your celebration.'],
  ['Where do you travel?', `Based in Big Timber, I regularly serve ${SITE.cities.slice(1).join(', ')}, and all of Southwest Montana. Farther afield is possible subject to travel costs and availability.`],
  ['Can you work with our budget?', "I'm honored to work with couples at most price points. I offer thoughtful substitutions and creative design solutions to focus on the moments with the greatest impact. Let's connect and see what we can make happen."],
  ['Are your designs sustainable?', 'Designs are foam-free wherever possible and avoid single-use plastics. Flowers are sourced locally when in season, and otherwise from wholesalers who value sustainability.'],
];
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(([q, a]) => ({
    '@type': 'Question', name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};
---
<Base title={page!.data.seoTitle} description={page!.data.description}>
  <script type="application/ld+json" set:html={JSON.stringify(faqSchema)} />
  <article class="wrap flow">
    <h1>Wedding flowers</h1>
    <Content />
    <AlaCarteTable />
    <section>
      <h2>Where we travel</h2>
      <p>Sapphire Stem is based in Big Timber and serves couples across Montana. We regularly design weddings in {SITE.cities.slice(1, -1).join(', ')}, and {SITE.cities.at(-1)} — and everywhere between. Not in Southwest Montana? Travel options are available, subject to travel costs and availability.</p>
    </section>
    <section>
      <h2>Common questions</h2>
      {faqs.map(([q, a]) => (
        <details><summary>{q}</summary><p>{a}</p></details>
      ))}
    </section>
  </article>
  <Cta heading="Ready to talk flowers?" />
</Base>
<style>
  .flow { padding-block: var(--s5); display: flex; flex-direction: column; gap: var(--s4); }
  .flow :global(h2) { padding-top: var(--s2); }
  details { border-bottom: 1px solid var(--line); padding-block: var(--s2); }
  summary { cursor: pointer; font-weight: 700; }
  details p { padding-top: var(--s2); }
</style>
```

- [ ] **Step 4: Verify green, commit**

Run: `npm run verify` → PASS.
```bash
git add -A && git commit -m "Add weddings page with pricing table, travel section, FAQ schema"
```

---

### Task 9: Contact form, thank-you

**Files:**
- Create: `src/pages/contact.astro`, `src/components/InquiryForm.astro`, `src/pages/thank-you.astro`
- Modify: `scripts/verify.mjs`

- [ ] **Step 1: Failing assertions**

```js
'/contact': { h1: "I'd love to be your florist", descIncludes: 'booking' },
```
Ad-hoc, after the loop:
```js
const contact = readFileSync(routeFile('/contact'), 'utf8');
if (!contact.includes('data-netlify="true"')) fail('/contact: Netlify form attribute missing');
if (!contact.includes('netlify-honeypot')) fail('/contact: honeypot missing');
if ((contact.match(/<label/g) ?? []).length < 10) fail('/contact: labels missing');
const ty = readFileSync(routeFile('/thank-you'), 'utf8');
if (!ty.includes('noindex')) fail('/thank-you: noindex missing');
```
Run: `npm run verify` → FAIL.

- [ ] **Step 2: Write InquiryForm.astro**

```astro
---
const budgets = ['Under $1,000', '$1,000–$2,500', '$2,500–$5,000', '$5,000–$10,000', '$10,000+', 'Not sure yet'];
---
<form name="inquiry" method="POST" action="/thank-you" data-netlify="true" netlify-honeypot="bouquet-field">
  <input type="hidden" name="form-name" value="inquiry" />
  <p class="hp"><label>Leave this field empty <input name="bouquet-field" /></label></p>

  <div class="row">
    <label>Name <input name="name" required autocomplete="name" /></label>
    <label>Email <input type="email" name="email" required autocomplete="email" /></label>
  </div>
  <div class="row">
    <label>Phone <input type="tel" name="phone" autocomplete="tel" /></label>
    <label>Event date <input type="date" name="event-date" /></label>
  </div>
  <div class="row">
    <label>Event type
      <select name="event-type">
        <option>Wedding</option><option>Event</option><option>Other</option>
      </select>
    </label>
    <label>Approximate guest count <input type="number" name="guest-count" min="1" /></label>
  </div>
  <label>Venue or location <input name="venue" /></label>
  <div class="row">
    <label>Interested in
      <select name="service">
        <option>À la carte</option><option>Full service</option><option>Not sure yet</option>
      </select>
    </label>
    <label>Floral budget range
      <select name="budget">{budgets.map((b) => <option>{b}</option>)}</select>
    </label>
  </div>
  <label>How did you hear about Sapphire Stem? <input name="referral" /></label>
  <label>Tell me about your day <textarea name="details" rows="6"></textarea></label>
  <button class="btn" type="submit">Send inquiry</button>
</form>
<style>
  form { display: flex; flex-direction: column; gap: var(--s3); max-width: 44rem; }
  label { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 700; flex: 1; }
  input, select, textarea { font: inherit; font-weight: 400; padding: 0.6rem 0.7rem;
    border: 1px solid var(--line); border-radius: 2px; background: var(--surface); color: var(--ink); }
  .row { display: flex; gap: var(--s3); flex-wrap: wrap; }
  .hp { position: absolute; left: -9999px; }
  button { border: 0; cursor: pointer; align-self: flex-start; }
</style>
```

- [ ] **Step 3: Write contact.astro and thank-you.astro**

`contact.astro`:
```astro
---
import { getEntry, render } from 'astro:content';
import Base from '../layouts/Base.astro';
import InquiryForm from '../components/InquiryForm.astro';
import { SITE } from '../data/site';
const page = await getEntry('pages', 'contact');
const { Content } = await render(page!);
---
<Base title={page!.data.seoTitle} description={page!.data.description}>
  <section class="wrap flow">
    <h1>{page!.data.title}</h1>
    <Content />
    <InquiryForm />
    <p>Or reach me directly: <a href={SITE.phoneHref}>{SITE.phone}</a> · <a href={`mailto:${SITE.email}`}>{SITE.email}</a> · <a href={SITE.instagramUrl}>Instagram</a></p>
  </section>
</Base>
<style>.flow { padding-block: var(--s5); display: flex; flex-direction: column; gap: var(--s4); }</style>
```

`thank-you.astro`:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Thank you — Sapphire Stem Floral Design" description="Your inquiry is in. Beka will get back to you within a few days about your Montana wedding or event flowers." noindex>
  <section class="wrap" style="padding-block: var(--s6); text-align: center;">
    <h1>Thank you</h1>
    <p style="margin-inline: auto; padding-block: var(--s3);">Your inquiry is on its way. I'll be in touch within a few days — in the meantime, the portfolio is right this way.</p>
    <a class="btn" href="/portfolio">See recent work</a>
  </section>
</Base>
```

- [ ] **Step 4: Verify green, commit**

Run: `npm run verify` → PASS. Also confirm `/thank-you` absent from `dist/sitemap-0.xml`.
```bash
git add -A && git commit -m "Add contact page with Netlify inquiry form and thank-you page"
```

---

### Task 10: Decap CMS admin

**Files:**
- Create: `public/admin/index.html`, `public/admin/config.yml`

**Interfaces:**
- Consumes: collection shapes from Task 2 (field names must match Zod schemas exactly: `title`, `image`, `alt`, `credit`, `category`, `featured`, `order`; alacarte `items[]` fields; settings `bookingBanner`).

- [ ] **Step 1: Write public/admin/index.html**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Sapphire Stem — Content Manager</title>
</head>
<body>
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</body>
</html>
```
(CDN script is the standard Decap install; it loads only on `/admin`, so the site's JS budget is untouched — verify.mjs counts only `dist/**/*.js` emitted by Astro, and this is an external URL.)

- [ ] **Step 2: Write public/admin/config.yml**

```yaml
backend:
  name: git-gateway
  # Values below come from the DecapBridge dashboard after registering the
  # site (Task: launch checklist). DecapBridge replaces deprecated Netlify
  # Identity; Beka logs in with Google or email/password.
  gateway_url: https://gateway.decapbridge.com
  site_id: FROM_DECAPBRIDGE_DASHBOARD

media_folder: src/assets/portfolio
public_folder: ../../assets/portfolio

collections:
  - name: portfolio
    label: Portfolio
    label_singular: Photo
    folder: src/content/portfolio
    create: true
    slug: '{{slug}}'
    fields:
      - { name: title, label: Title }
      - { name: image, label: Photo, widget: image }
      - { name: alt, label: 'Describe the photo (required — helps Google and screen readers)', widget: string }
      - { name: credit, label: Photographer credit, required: false }
      - { name: category, label: Category, widget: select, options: [wedding, event, personals, installation] }
      - { name: featured, label: Show on homepage, widget: boolean, default: false }
      - { name: order, label: Sort order, widget: number, default: 0 }
      - { name: body, label: Notes, widget: markdown, required: false }

  - name: prices
    label: À la carte prices
    files:
      - name: alacarte
        label: Price menu
        file: src/content/data/alacarte.json
        fields:
          - { name: id, widget: hidden, default: alacarte }
          - name: items
            label: Menu items
            widget: list
            fields:
              - { name: category, label: Section, widget: select, options: [personals, ceremony, reception] }
              - { name: name, label: Item }
              - { name: startingAt, label: 'Starting at ($)', widget: number, value_type: int, min: 1 }
              - { name: note, label: Note, required: false }
              - { name: order, label: Sort order, widget: number, default: 0 }

  - name: settings
    label: Site settings
    files:
      - name: settings
        label: Booking banner
        file: src/content/data/settings.json
        fields:
          - { name: id, widget: hidden, default: settings }
          - { name: bookingBanner, label: 'Banner text (shown at the top of every page)' }
```

- [ ] **Step 3: Sanity-check field parity**

Diff each config.yml field list against the Zod schemas in `src/content.config.ts` — names and enum values must match exactly, or Beka's first save produces a failing build.

- [ ] **Step 4: Verify /admin builds and is excluded from sitemap**

Run: `npm run verify && grep -L admin dist/sitemap-0.xml`
Expected: verify PASS; `dist/admin/index.html` exists; sitemap contains no admin URL.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add Decap CMS admin with DecapBridge backend config"
```

---

### Task 11: OG image, handoff doc, final review

**Files:**
- Create: `public/og-default.jpg` (1200×630 crop of hero via sharp one-liner below), `docs/HANDOFF.md`
- Modify: none

- [ ] **Step 1: Generate OG image**

```bash
node -e "import('sharp').then(({default:s})=>s('src/assets/site/hero.jpg').resize(1200,630,{fit:'cover'}).jpeg({quality:80}).toFile('public/og-default.jpg'))"
```

- [ ] **Step 2: Write docs/HANDOFF.md**

Beka-facing, plain language. Required sections:
1. **Logging in** — `sapphirestemfloral.com/admin`, DecapBridge email invite flow.
2. **Adding a wedding to the portfolio** — upload, the alt-text field explained ("describe the photo like you're telling someone on the phone"), photographer credit, featured toggle. Note: publishing takes ~2 minutes to go live (build).
3. **Changing prices** — one screen, edit, publish.
4. **The banner** — update the years as seasons roll over.
5. **Things to confirm** — phone number (406 vs 808), price table accuracy, whether table garland is per foot, extending the "Why Sapphire Stem" naming story (engagement-ring detail was truncated in migration), photo credits per image.
6. **What not to do** — don't upload phone photos over ~8 MB (they'll work but slow the repo), don't edit anything outside the three CMS sections without calling us.

- [ ] **Step 3: Full verification sweep**

Run: `npm run check && npm run verify`
Expected: all green. Then manual passes:
- `npx astro preview` + browser: keyboard-only walk of nav, lightbox, form; mobile viewport check at 360 px.
- Disable JS in devtools: every route readable, form submittable.
- Rich Results Test (manual, after first deploy): Florist + FAQPage pass.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "Add OG image and client handoff doc"
```

---

### Task 12: Deploy (operator steps — run with the user)

Not agent-executable alone; do interactively with the user.

- [ ] Push repo to GitHub (private).
- [ ] `netlify init` (or Netlify UI): link repo, build command `npm run verify`, publish `dist`.
- [ ] Netlify UI → Forms: confirm `inquiry` detected after first deploy; add email notification → `sapphirestemfloral@gmail.com`.
- [ ] Register site at decapbridge.com (free tier) with the GitHub repo; paste issued values into `public/admin/config.yml` (`site_id`, and any auth fields the dashboard emits); invite Beka's email; redeploy.
- [ ] Test the full CMS loop as Beka would: log in, edit banner, publish, confirm deploy + live change.
- [ ] Submit a test inquiry end-to-end; confirm email arrives.
- [ ] Lighthouse mobile run on the deploy preview: Performance ≥ 95, and record all four scores in the PR/handoff.
- [ ] With Beka's confirmation of phone + prices: point DNS at Netlify, then Search Console — submit sitemap; align Google Business Profile per `docs/client/google-business-profile.html`.

---

## Self-review notes

- **Spec coverage:** §3 stack/budget → Tasks 1, 5 (gates in verify.mjs); §4 content model → Task 2 (+3 for portfolio data); §5 CMS → Task 10 + 12; §6 SEO incl. 6.1 service area → Tasks 4, 5, 8 (travel section + cities in schema); §7 form → Task 9; §8 pages/flow → Tasks 5–9; §9 testing → verify.mjs per task + Task 11 sweep; §10 launch → Task 12. Per-city landing pages: deliberately absent (spec says deferred).
- **Type consistency:** collection names (`pages`, `portfolio`, `alacarte`, `settings`), entry ids (`alacarte`, `settings`), and Decap field names cross-checked against `content.config.ts`; `SITE` shape consistent across Header/Footer/Schema/weddings/contact.
- **Known judgment calls encoded:** phone defaults to the 406 number (site-footer evidence) pending confirmation; à la carte prices from position-mapped extraction, flagged for confirmation; `credit` optional because photo→photographer mapping doesn't exist in the source.
