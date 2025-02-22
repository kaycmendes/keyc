import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@keyc/cloudflare': fileURLToPath(new URL('./packages/cloudflare/dist', import.meta.url)),
      '@keyc/sqlite': fileURLToPath(new URL('./packages/sqlite/dist', import.meta.url)),
      '@keyc/core': fileURLToPath(new URL('./packages/keyc/dist', import.meta.url))
    }
  },
  test: {
    passWithNoTests: true,
    include: ['**/*.{test,spec}.?(c|m)[tj]s?(x)']
  }
}); 