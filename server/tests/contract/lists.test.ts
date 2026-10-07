import { describe, it, expect } from 'vitest'
import { getJSON, serverUp, exactKeys, eachItem } from './helpers'

const CASES: Array<{
  path: string
  keys: string[]
  minLength?: number
}> = [
  { path: '/api/public/departments',      keys: ['id','name','en','description'], minLength: 4 },
  { path: '/api/public/council-members',  keys: ['id','title','name'],            minLength: 5 },
  { path: '/api/public/studios',          keys: ['id','slug','name','en','description','tags'], minLength: 2 },
  { path: '/api/public/projects',         keys: ['id','title','stage','statusLabel','description'], minLength: 4 },
  { path: '/api/public/events',           keys: ['id','term','title','statusLabel','description','date'], minLength: 4 },
  { path: '/api/public/wall',             keys: ['id','kind','caption','dateLabel','image','ratio'], minLength: 7 }, // draft 不返回
  { path: '/api/public/notes',            keys: ['id','slug','category','title','date','lede','content'] },
]

describe.skipIf(!(await serverUp()))('GET /api/public/* 列表契约', () => {

  for (const { path, keys, minLength } of CASES) {
    it(`${path} 返回 {data:[]},元素键集精确匹配`, async () => {
      const { res, body } = await getJSON(path)
      expect(res.status).toBe(200)
      expect(Array.isArray(body.data)).toBe(true)
      if (minLength) expect(body.data.length).toBeGreaterThanOrEqual(minLength)
      eachItem(body.data, (item) => exactKeys(item, keys))
      // 隐私红线:不得出现 _status / sort / createdAt / updatedAt
      eachItem(body.data, (item) => {
        expect(item).not.toHaveProperty('_status')
        expect(item).not.toHaveProperty('sort')
        expect(item).not.toHaveProperty('createdAt')
        expect(item).not.toHaveProperty('updatedAt')
      })
    })
  }

  it('/api/public/members 元素 department 展开为浅对象', async () => {
    const { body } = await getJSON('/api/public/members')
    eachItem(body.data, (item) => {
      exactKeys(item, ['id','name','pinyin','tag','department','college','year','bio','quote','tags','featured'])
      if (item.department !== null) {
        exactKeys(item.department as Record<string, unknown>, ['id','name','en'])
      }
    })
  })
})
