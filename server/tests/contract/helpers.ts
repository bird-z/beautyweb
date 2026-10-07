// 契约测试 helper:断言响应形状与 docs/api/public-rest-api.md 一致
import { expect } from 'vitest'

const BASE = process.env.API_BASE || 'http://localhost:3000'

export async function getJSON(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Origin: 'https://bioqif.com' },
  })
  const body = await res.json()
  return { res, body }
}

/** server 未起时返回 false,让调用方可以 skip 而不是 fail */
export async function serverUp(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

/** 深度键集相等:对象的键集合必须恰好等于 expectedKeys */
export function exactKeys(obj: Record<string, unknown>, expectedKeys: string[]) {
  const got = Object.keys(obj).sort()
  const want = [...expectedKeys].sort()
  expect(got).toEqual(want)
}

/** 每个元素都满足形状 */
export function eachItem<T>(arr: unknown, assert: (item: Record<string, unknown>) => void) {
  expect(Array.isArray(arr)).toBe(true)
  for (const item of arr as Record<string, unknown>[]) assert(item)
}
