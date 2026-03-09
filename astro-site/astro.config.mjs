import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  site: 'https://lio-snp.github.io',
  // The current @astrojs/sitemap version crashes at build:done in this repo.
  // Keep the content build stable first; re-enable sitemap after the integration is upgraded or patched.
  integrations: [mdx()],
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex]
  }
});
