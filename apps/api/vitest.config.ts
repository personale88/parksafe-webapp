import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['**/*.integration.test.ts', '**/node_modules/**'],
    environment: 'node',
    globals: true,
    env: {
      NODE_ENV: 'development',
    },
    coverage: {
      provider: 'v8',
      include: ['src/services/**'],
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
})
