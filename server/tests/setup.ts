// 测试共享 helper:每个测试文件用 once() 拿一个 payload 实例,
// 跑完自己 afterAll 里 destroy;文件间不共享连接。
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

let cached: Promise<Payload> | null = null

export function payloadClient(): Promise<Payload> {
  if (!cached) cached = getPayload({ config })
  return cached
}

/** 环境是否可跑 DB 测试(缺 secret / DATABASE_URL 时返回 false) */
export function dbTestReady(): boolean {
  return Boolean(process.env.PAYLOAD_SECRET && process.env.DATABASE_URL)
}

export async function teardown() {
  if (cached) {
    const p = await cached
    await p.db.destroy?.()
    cached = null
  }
}
