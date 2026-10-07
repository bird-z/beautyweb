import { describe, it, expect, afterAll } from 'vitest'
import { payloadClient, teardown, dbTestReady } from './setup'

describe.skipIf(!dbTestReady())('access control', () => {
  afterAll(teardown)

  it('匿名可以创建 join-applications(公开表单)', async () => {
    const payload = await payloadClient()
    const created = await payload.create({
      collection: 'join-applications',
      overrideAccess: false, // 走 access.create: () => true
      data: {
        name: '测试用户',
        contact: 'test@example.com',
        college: '测试学院',
        major: '测试专业',
        year: '2025 级',
        department: '秘书部',
        interests: [{ value: '测试' }],
        message: '这是一条测试申请',
        status: 'pending',
      },
    })
    expect(created.id).toBeTruthy()
    expect(created.status).toBe('pending')
    // 清理
    await payload.delete({ collection: 'join-applications', id: created.id, overrideAccess: true })
  })

  it('匿名不能读 join-applications(隐私保护)', async () => {
    const payload = await payloadClient()
    // 匿名 = 不传 user,read access = adminsOnly → 应返回空数组(Payload 对匿名 list 返回 [])
    const result = await payload.find({
      collection: 'join-applications',
      overrideAccess: false,
      limit: 1,
    })
    expect(result.docs.length).toBe(0)
  })

  it('匿名不能读 draft 状态的 members', async () => {
    const payload = await payloadClient()
    // 造一条 draft member
    const draft = await payload.create({
      collection: 'members',
      overrideAccess: true,
      data: {
        _status: 'draft',
        name: 'draft-test-member',
        tag: '测试',
        department: (await payload.find({ collection: 'departments', limit: 1, overrideAccess: true })).docs[0]?.id,
        college: '测试',
        year: '2025',
        bio: 'x',
        quote: 'x',
      },
    })
    const anon = await payload.find({
      collection: 'members',
      overrideAccess: false,
      where: { id: { equals: draft.id } },
    })
    expect(anon.docs.length).toBe(0)
    await payload.delete({ collection: 'members', id: draft.id, overrideAccess: true })
  })
})
