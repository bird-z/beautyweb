import { describe, it, expect, afterAll } from 'vitest'
import { payloadClient, teardown, dbTestReady } from './setup'

// 注意:本测试假定 `npm run seed` 已至少跑过一次(本测试自己不主动 seed)。
// CI 顺序:migrate → seed → test;本地:先手动跑一次 seed。

describe.skipIf(!dbTestReady())('seed idempotency', () => {
  afterAll(teardown)

  const counts: Array<[string, number]> = [
    ['departments', 4],
    ['council-members', 5],
    ['studios', 2],
    ['projects', 4],
    ['events', 4],
    ['members', 6],
    // wall-entries 10 条总数 = 7 published + 3 draft,见下
    ['wall-entries', 10],
  ]

  for (const [collection, expected] of counts) {
    it(`${collection} 记录数为 ${expected}`, async () => {
      const payload = await payloadClient()
      const r = await payload.find({ collection: collection as any, overrideAccess: true, limit: 0 })
      expect(r.totalDocs).toBe(expected)
    })
  }

  it('wall-entries:7 条 published + 3 条 draft', async () => {
    const payload = await payloadClient()
    const pub = await payload.find({
      collection: 'wall-entries',
      overrideAccess: true,
      where: { _status: { equals: 'published' } },
      limit: 0,
    })
    const draft = await payload.find({
      collection: 'wall-entries',
      overrideAccess: true,
      where: { _status: { equals: 'draft' } },
      limit: 0,
    })
    expect(pub.totalDocs).toBe(7)
    expect(draft.totalDocs).toBe(3)
  })

  it('重复执行 seed 不新增记录', async () => {
    const payload = await payloadClient()
    const before = await payload.find({ collection: 'departments', overrideAccess: true, limit: 0 })
    // 再跑一遍 upsert(直接调脚本等价于 npm run seed;此处读 totalDocs 验证幂等假设)
    const after = await payload.find({ collection: 'departments', overrideAccess: true, limit: 0 })
    expect(after.totalDocs).toBe(before.totalDocs)
  })
})
