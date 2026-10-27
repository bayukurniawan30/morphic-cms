import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // The CLI package runs its tests separately with node --test.
    include: ['src/**/*.test.{ts,tsx,js,jsx,mjs,cjs}'],
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
