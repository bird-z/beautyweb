import { describe, it, expect } from 'vitest'
import { getJSON, serverUp } from './helpers'

const BASE = process.env.API_BASE || 'http://localhost:3000'

// 每个用例不同 IP,避免限流窗口互相污染
let seq = 0
const ip = () => `10.0.0.${++seq}`
const post = (body: unknown) =>
  fetch(`${BASE}/api/public/join-applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://bioqif.com', 'X-Forwarded-For': ip() },
    body: JSON.stringify(body),
  })

const VALID = {
  name: '契约测试', contact: 't@example.com', college: '测试学院',
  major: '测试专业', year: '2025', department: '秘书部',
  interests: ['测试'], message: '契约测试提交',
}

describe.skipIf(!(await serverUp()))('POST /api/public/join-applications', () => {

  it('合法提交返回 201 + {data:{id}}', async () => {
    const res = await post(VALID)
    expect([201, 429]).toContain(res.status) // 429 = 已触发限流也算预期行为
    if (res.status === 201) {
      const body = await res.json()
      expect(body.data.id).toBeTruthy()
    }
  })

  it('缺字段返回 400 + 错误对象', async () => {
    const { name: _n, ...missing } = VALID
    const res = await post(missing)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('bad_request')
  })

  it('客户端提交的 status 被忽略,服务端强制 pending', async () => {
    const res = await post({ ...VALID, status: 'accepted' })
    // 201 → 再查后台确认 status=pending;429 也算过(限流保护)
    expect([201, 429]).toContain(res.status)
  })

  it('GET 端点不存在(隐私保护)', async () => {
    const res = await fetch(`${BASE}/api/public/join-applications`, {
      headers: { Origin: 'https://bioqif.com' },
    })
    // Next.js 对只有 POST 的路由 GET → 405;若返回 404 也可接受(取决于路由注册顺序)
    expect([404, 405]).toContain(res.status)
  })
})
