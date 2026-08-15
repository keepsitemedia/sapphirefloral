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

const reviews = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/reviews' }),
  schema: z.object({
    quote: z.string().min(1),
    name: z.string().min(1),
    event: z.string().optional(),
    order: z.number().default(0),
    // Seeded examples so the band can be designed before Beka has real
    // reviews. scripts/verify.mjs fails the build while any remain true, so a
    // placeholder cannot reach production.
    placeholder: z.boolean().default(false),
  }),
});

const settings = defineCollection({
  loader: file('./src/content/data/settings.json'),
  schema: z.object({ id: z.string(), bookingBanner: z.string() }),
});

export const collections = { pages, portfolio, alacarte, settings, reviews };
