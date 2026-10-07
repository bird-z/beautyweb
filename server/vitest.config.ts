import path from 'path'
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@payload-config': path.resolve(dirname, 'src/payload.config.ts'),
      '@': path.resolve(dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // payload 初始化较慢
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // 串行跑,避免 seed 与 access 测试抢 DB
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
  },
})
