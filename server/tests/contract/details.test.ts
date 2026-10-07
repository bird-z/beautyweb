import { describe, it, expect } from 'vitest'
import { getJSON, serverUp } from './helpers'

describe.skipIf(!(await serverUp()))('详情查询 (?slug= / ?id=)', () => {

  it('命中返回 1 元素数组', async () => {
    const { body: list } = await getJSON('/api/public/studios')
    const slug = list.data[0]?.slug
    if (!slug) return // 空库跳过
    const { body } = await getJSON(`/api/public/studios?slug=${encodeURIComponent(slug)}`)
    expect(body.data.length).toBe(1)
    expect(body.data[0].slug).toBe(slug)
  })

  it('未命中返回空数组而不是 404', async () => {
    const { res, body } = await getJSON('/api/public/studios?slug=no-such-studio-xyz')
    expect(res.status).toBe(200)
    expect(body.data).toEqual([])
  })

  it('既有 /api/public-articles 详情契约不变', async () => {
    const { res, body } = await getJSON('/api/public-articles?slug=no-such-article-xyz')
    expect(res.status).toBe(200)
    expect(body.data).toEqual([])
  })
})
