# Sapphire Stem Floral Design — Site Rebuild

**Date:** 2026-08-13
**Client:** Beka Greenall, Sapphire Stem Floral Design (Big Timber, MT)
**Replaces:** sapphirestemfloral.com (Canva Sites export)
**Status:** Design approved, ready for implementation planning

---

## 1. Context

### What exists today

The current site is a Canva Sites export. Every route (`/`, `/about`, `/contact`,
`/portfolio`, `/weddings`) serves a 312 KB HTML shell containing the entire site
document — all seven page roots, including two orphaned seasonal pages
("Valentine's Arrangements", "Prom Florals") that are in neither the navigation
nor the sitemap. Each shell references 316 media URLs covering 144 unique images
that average 551 KB, the largest being a 4.8 MB PNG. A 2.5 MB JavaScript bundle
renders the page.

### Measured defects

| Check | Current state |
|---|---|
| Text in HTML | None. Only `<title>` is present; all copy is painted by JS into positioned divs |
| Headings (`h1`–`h6`) | Zero, sitewide |
| Image alt text | Zero (`altText: 0`, `aria: 0` in the document JSON) |
| Meta description | Absent, sitewide |
| Page titles | `About`, `Contact`, `Portfolio`, `Weddings` — no brand, no location |
| `og:description`, `og:image` | Absent |
| Canonical tags | Absent |
| JSON-LD structured data | Absent |
| `robots.txt` | Returns 404 |
| Internal nav links | Fragments (`#page-4`, `#page-5`, `#page-6`) rather than URLs |
| Layout | Fixed 1366×768 canvas, proportionally scaled — zoom, not reflow |
| Typography | 6 families across 48 font files; one woff2 is 203 KB |
| Inquiry form | Sandboxed Canva iframe widget; no field control, no routing, no lead capture |
| NAP consistency | Two phone numbers live: (406) 219-1116 and (808) 741-3035 |
| Seasonal content | Valentine's Day and Prom pages live in August with active Square checkout links |

The underlying business content is strong — sustainability positioning, budget
candor, a published à la carte menu, and a differentiated founder story. The
platform is what fails it.

### Goals

1. All content present in server-rendered HTML and crawlable.
2. Genuinely responsive layout, not a scaled fixed canvas.
3. An inquiry form Beka owns, that qualifies leads.
4. Beka can update her portfolio and à la carte prices without a developer.
5. Complete, correct local-SEO metadata for a Big Timber / Southwest Montana florist.

### Non-goals

- Seasonal shop pages (Valentine's, Prom). Cut by decision; Square remains
  available to her outside the site.
- E-commerce or payment handling on-site.
- Brand identity redesign. Existing palette and voice are preserved.
- Blog or editorial content.

---

## 2. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Engagement | Live client rebuild | Content, phone number, and links must be accurate; domain cutover in scope |
| Page scope | 5 core pages, seasonal dropped | Removes the demonstrated staleness failure mode |
| Photography | Reuse Canva exports, optimize aggressively | No dependency on Beka to gather originals; quality capped at what is live today |
| CMS | Decap CMS + DecapBridge auth | Netlify Identity and Git Gateway are deprecated; DecapBridge lets Beka log in with Google or email/password and never see GitHub |
| Design fidelity | Same spirit, rebuilt properly | Keep copy, structure, page order, palette; rebuild on a real responsive grid with two typefaces instead of six |
| Content architecture | Collections everywhere, narrow CMS exposure | All copy in typed collections; Decap exposes only Portfolio, À la carte, and the booking banner |

---

## 3. Architecture

### Stack

- **Astro 5**, static output (`output: 'static'`). No adapter, no serverless functions.
- **No UI framework.** No hydration. The only client JS is a mobile-nav toggle
  and a portfolio lightbox — both progressive enhancements, both under 2 KB, both
  optional to the page working.
- **Styling:** hand-authored CSS with custom-property design tokens plus Astro
  scoped component styles. No Tailwind.
- **Images:** `astro:assets` — AVIF with WebP fallback, `srcset` at four widths,
  explicit `width`/`height` on every image, `loading="lazy"` below the fold,
  single preloaded hero.
- **Fonts:** two families, self-hosted, Latin-subset, `woff2` only,
  `font-display: swap`, one preload.
- **Hosting:** Netlify, static deploy from Git.
- **Forms:** Netlify Forms (static HTML form + honeypot).

### Performance budget

Implementation is held to these numbers; exceeding one is a build failure to be
resolved, not a tradeoff to accept silently.

| Metric | Current | Target |
|---|---|---|
| HTML per route | 312 KB | < 15 KB |
| JavaScript | 2.5 MB | < 5 KB |
| Font files | 48 files / 6 families | 2–4 files / 2 families |
| Largest single image | 4.8 MB | < 200 KB |
| Total first load | Tens of MB | < 400 KB |
| Text visible with JS disabled | None | All |
| Lighthouse mobile performance | Not measured (rate-limited) | ≥ 95 |
| Cumulative Layout Shift | Not measured | < 0.02 |

### Repository layout

```
src/
  components/     SEO.astro, Header.astro, Footer.astro, InquiryForm.astro,
                  PortfolioGrid.astro, AlaCarteTable.astro, Cta.astro
  content/
    config.ts     collection schemas (Zod)
    pages/        home.md, about.md, weddings.md, contact.md
    portfolio/    one .md per gallery entry
    data/
      alacarte.json
      settings.json
  assets/
    portfolio/    Decap upload target — flows through astro:assets
    site/         hero and static imagery
  layouts/        Base.astro
  pages/          index.astro, about.astro, portfolio.astro, weddings.astro,
                  contact.astro, thank-you.astro, 404.astro
  styles/         tokens.css, base.css
public/
  admin/          index.html, config.yml   (Decap)
  robots.txt
docs/
  HANDOFF.md      Beka-facing CMS guide
```

---

## 4. Content model

Four collections. Three are exposed to Decap.

### `portfolio` — glob collection, Markdown

| Field | Type | Notes |
|---|---|---|
| `title` | string, required | |
| `image` | `image()` helper, required | Optimized by `astro:assets` |
| `alt` | string, required, `.min(1)` | **Build fails if empty** — enforces accessibility and image SEO at the pipeline, not by reminder |
| `credit` | string, optional | Photographer attribution. Known credits: Kindzerski Photography, Cinema by Alle, John Scott Bly, Job Greenall |
| `category` | enum: `wedding`, `event`, `personals`, `installation` | |
| `featured` | boolean, default `false` | Drives the homepage selection |
| `order` | number, default `0` | Manual sort |

**Exposed in Decap.**

### `alacarte` — single JSON file via `file()` loader

Array of items:

| Field | Type | Notes |
|---|---|---|
| `category` | enum: `personals`, `ceremony`, `reception` | |
| `name` | string, required | |
| `startingAt` | number, required | Rendered as "Starting at $N" |
| `note` | string, optional | |
| `order` | number | |

Edited in Decap as **one screen** with a repeatable list, so a full seasonal
price update is a single edit rather than fourteen file opens. Renders as a
semantic `<table>` grouped by category.

Known items from the current site, to be confirmed against the live page:

- **Personals:** bridal bouquet, bridesmaid bouquet, boutonniere, pocket square, corsages
- **Ceremony:** aisle marker, arch accent flowers, pedestal arrangement, meadow semi circle, full arch
- **Reception:** bud vases, petite centerpiece, signature centerpiece, long and low centerpiece, bar arrangement, table garland, cake flowers

Prices recovered from the Canva document via element-position mapping
(items and "Starting at" values pair by column offset):

| Personals | | Ceremony | | Reception | |
|---|---|---|---|---|---|
| Bridal bouquet | $250 | Aisle marker | $250 | Bud vases | $10 |
| Boutonniere | $25 | Arch accent flowers | $350 | Petite centerpiece | $50 |
| Pocket square | $35 | Pedestal arrangement | $500 | Signature centerpiece | $175 |
| Corsages | $45 | Meadow semi circle | $1,500 | Long & low centerpiece | $250 |
| Bridesmaid bouquet | $75 | Full arch | $2,500 | Bar arrangement | $300 |
| | | | | Table garland | $40 |
| | | | | Cake flowers | $40 |

Policy copy, verbatim from the live page: $100 order minimum; delivery and
setup offered for floral totals of $2,000+, starting at $500 plus mileage;
50% non-refundable retainer to reserve a date; full service weddings begin
at $4,000. Beka confirms the table before launch (in particular whether
table garland is priced per foot).

**Exposed in Decap.**

### `settings` — single JSON file

| Field | Type | Notes |
|---|---|---|
| `bookingBanner` | string | Currently "NOW BOOKING 2026 & 2027 WEDDINGS AND EVENTS" |

Exposed in Decap as a single text field. This is the highest staleness-risk
element on the site and the same failure mode that left Valentine's arrangements
live in August; Beka owns it directly.

**Exposed in Decap.**

### `pages` — glob collection, Markdown

`home.md`, `about.md`, `weddings.md`, `contact.md`. Body copy plus frontmatter
for per-page SEO title and description.

**Not exposed in Decap.** Edited by the developer. Exposing any of these later is
adding a collection block to `config.yml` — no refactor required. This is the
reason the copy lives in collections rather than in `.astro` markup.

---

## 5. CMS

- **Decap CMS 3.x**, served from `/admin`.
- **Auth: DecapBridge.** Netlify Identity and Git Gateway are deprecated and new
  Git Gateway configurations are explicitly not recommended. DecapBridge's free
  tier covers 3 sites and 10 collaborators. Beka signs in with Google or an
  email/password and never encounters GitHub, branches, or commits.
- **Editorial workflow: off.** Direct publish to `main`. A review queue with one
  editor and one developer is friction without benefit.
- **Media folder: `src/assets/portfolio/`**, not `public/`. Uploads must flow
  through the Astro image pipeline. Files placed in `public/` bypass optimization
  entirely and ship at full weight — the standard Astro + Decap mistake, and the
  one that would quietly undo the performance budget the first time Beka adds a
  wedding.

**Known limitation:** Decap does not resize on upload. A 5 MB phone photo is
stored in the repo at 5 MB even though the served image is optimized. The repo
grows; the site does not slow down. Documented in `docs/HANDOFF.md`. If repo size
becomes a problem, Netlify Image CDN addresses it without a rebuild.

---

## 6. SEO

Every item below is downstream of the primary fix: **the text exists in the HTML.**

### Per-page metadata

A single `<SEO>` component emits title, description, canonical, Open Graph, and
Twitter card tags, with a real per-page `og:image`.

| Route | Title |
|---|---|
| `/` | Montana Wedding Florist — Sapphire Stem Floral Design |
| `/about` | About Beka Greenall — Sapphire Stem Floral Design |
| `/portfolio` | Wedding Floral Portfolio — Montana |
| `/weddings` | Wedding Flowers & À La Carte Pricing — Montana |
| `/contact` | Inquire — Sapphire Stem Floral Design |

Titles lead with Montana rather than Big Timber: she travels statewide, and
Bozeman and Big Sky are far larger wedding markets than her home town. Big Timber
still appears in the descriptions, the `/weddings` travel section, and the
`Florist` schema.

Descriptions are authored per page in `pages/*.md` frontmatter, 140–160 characters.

### URLs

Paths are unchanged from the current site (`/`, `/about`, `/portfolio`,
`/weddings`, `/contact`). No redirects required; existing link equity is
preserved. The two orphaned seasonal pages were never in the sitemap or
navigation and are dropped without redirects.

### Structured data (JSON-LD)

- `Florist` / `LocalBusiness` — name, phone, email, `geo` for Big Timber,
  `sameAs` (Instagram `@sapphirestemfloral`, Facebook "Sapphire Stem Floral
  Design"), `priceRange`, `foundingDate: 2025`. Modelled as a **service-area
  business**: `areaServed` as an array of `City` entries rather than a
  `streetAddress`. See §6.1.
- `Service` — wedding and event floral design
- `BreadcrumbList` — inner pages
- `FAQPage` — `/weddings`, built from existing copy (how à la carte works, why
  foam-free, how budgets are handled)

### 6.1 Service area

Beka is a **travelling florist**, not a shop with a catchment. Confirmed service
area:

**Base:** Big Timber, MT (Sweet Grass County)
**Travels to:** Bozeman, Big Sky, Livingston, Billings, Butte, Missoula
**Plus nearby:** Columbus, Absarokee, Melville, McLeod

Missoula is roughly four hours from Big Timber, so this is a statewide radius —
which materially changes the positioning. She is not "a Big Timber florist"; she
is a Montana wedding florist who travels. Copy, titles, and schema should say so.

`areaServed` is an array of `City` objects covering the list above; no
`streetAddress` is published. Home-studio florists routinely hide the address,
and this matches how the Google Business Profile should be configured (see the
client guide at `docs/client/google-business-profile.html`).

The `/weddings` page carries a short, genuinely written **"Where we travel"**
section naming the cities in prose, so the terms exist as real crawlable content
rather than only as markup.

**Deliberately not doing:** per-city landing pages (`/weddings/bozeman`,
`/weddings/missoula`). It is the standard local-SEO play and it would probably
work, but six near-identical pages on a five-page site is thin content, and
Google has gotten materially better at demoting exactly that pattern. If Bozeman
and Big Sky prove to be where the revenue is, the right answer is two
substantial pages with real venue knowledge and real weddings from each — not
six templated ones. Flagged as a post-launch decision, not built now.

### Technical

- `@astrojs/sitemap` with real `lastmod`
- `robots.txt` that resolves, referencing the sitemap
- Exactly one `<h1>` per page, correct heading order throughout
- Alt text enforced by the content schema
- Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`)

### Blocking content item

The site currently publishes **(406) 219-1116** and **(808) 741-3035**. Local
ranking depends on the number matching the Google Business Profile exactly.
The build uses a single value defined in one place; **Beka must confirm which
number is correct before launch.**

---

## 7. Inquiry form

Plain HTML form — real `<label>` elements, native validation, functional with
JavaScript disabled. Replaces the sandboxed Canva iframe widget.

### Fields

```
Name (required)
Email (required)
Phone
Event date
Event type            wedding | event | other
Venue or location
Approximate guest count
Interested in         à la carte | full service | not sure yet
Floral budget range   (select)
How did you hear about Sapphire Stem?
Tell me about your day (textarea)
[honeypot, hidden]
```

**Budget range** earns its place twice: it spares Beka back-and-forth on
inquiries that were never going to convert, and it is consistent with her own
copy — *"We understand not everyone has an unlimited budget for flowers."*
Asked up front, it reads as candor rather than gatekeeping.

### Handling

- Netlify Forms, `data-netlify="true"`, `netlify-honeypot` on a hidden field.
- Email notification to `sapphirestemfloral@gmail.com`.
- Redirect to `/thank-you`, a real page carrying `noindex`, which also serves as
  the analytics conversion goal.
- No CAPTCHA initially. Add Netlify's reCAPTCHA integration only if honeypot
  proves insufficient.
- Free tier is 100 submissions/month — well above expected volume.

---

## 8. Pages & flow

**Navigation:** Portfolio · Weddings · About · Contact, with **Inquire** as a
visually distinct button present in the header on every page.

- **`/`** — hero with booking banner → positioning statement → three pillars
  (impactful design, environmental care, budget honesty) → featured portfolio →
  à la carte teaser → CTA
- **`/about`** — Beka's story (B.S. and Ph.D. in biology → florist), Est. 2025,
  studio location, CTA
- **`/portfolio`** — filterable-by-category grid, photographer credits, lightbox,
  "Featured on Montana Bride" credential
- **`/weddings`** — the conversion page: à la carte menu, how it works, full
  service description, FAQ, inquiry CTA
- **`/contact`** — inquiry form, email, phone, Instagram, Facebook, service area
- **`/thank-you`** — confirmation, expected response time, link back to portfolio
- **`/404`** — branded, links to Portfolio and Contact

Every page terminates in exactly one call to action.

---

## 9. Testing & verification

- **Build-time:** `astro check` passes; content schema validation catches missing
  alt text; build fails on broken image references.
- **Accessibility:** axe-core clean on all five routes; keyboard-navigable nav,
  lightbox, and form; visible focus states; contrast ratios verified against the
  final palette.
- **SEO:** every route asserted to contain its `<h1>`, meta description,
  canonical, and JSON-LD; Rich Results Test passes for `Florist` and `FAQPage`;
  sitemap and `robots.txt` resolve.
- **Performance:** Lighthouse mobile ≥ 95, measured against the budget table in
  §3. Every budget line verified before launch, not assumed.
- **No-JS:** every route renders complete content and the form submits with
  JavaScript disabled.
- **CMS:** end-to-end verification that Beka can add a portfolio entry, change an
  à la carte price, and edit the booking banner, and that each triggers a deploy.

---

## 10. Launch

1. Deploy to a Netlify subdomain for Beka's review.
2. Confirm the correct phone number and the à la carte price mapping.
3. Verify inquiry-form delivery to her inbox.
4. Walk her through `/admin` against `docs/HANDOFF.md`.
5. Cut DNS over from the Canva host.
6. Submit the sitemap in Google Search Console; align the Google Business Profile
   NAP with the site.

## 11. Open items

| Item | Owner | Blocking |
|---|---|---|
| Confirm phone number | Beka | Launch. (406) 219-1116 is the site-footer number on Weddings and Contact; (808) 741-3035 appeared only on the dropped Prom page. Build uses the 406 number pending confirmation |
| Confirm à la carte prices (§4 table) | Beka | Launch |
| Google Business Profile access for NAP alignment | Beka | Post-launch |
| DecapBridge account and site registration | Developer | CMS handoff |
