// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://shtev.dev',
  vite: {
    // Never inline scripts into HTML: the CSP is script-src 'self'.
    build: { assetsInlineLimit: 0 },
  },
});
