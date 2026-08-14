import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://sapphirestemfloral.com',
  trailingSlash: 'never',
  // Inlined CSS pushed the home page to 14.9KB against the 15KB HTML gate.
  // One immutable, cross-route cached stylesheet instead.
  build: { inlineStylesheets: 'never' },
  integrations: [
    sitemap({ filter: (page) => !page.includes('/thank-you') }),
  ],
});
