import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    // One worker: tests share the real Postgres test DB (§20's "server
    // persistence" is meant literally, not mocked), and truncate it between
    // files — running two test files concurrently against the same DB
    // would race.
    fileParallelism: false,
  },
})
