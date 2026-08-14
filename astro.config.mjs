import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://sapphirestemfloral.com',
  trailingSlash: 'never',
  integrations: [
    sitemap({ filter: (page) => !page.includes('/thank-you') }),
  ],
});
