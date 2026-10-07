import { describe, it, expect } from 'vitest'
import { getJSON, serverUp, exactKeys } from './helpers'

describe.skipIf(!(await serverUp()))('GET /api/public/site', () => {

  it('返回单元素数组,字段与契约一致', async () => {
    const { res, body } = await getJSON('/api/public/site')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBe(1)
    exactKeys(body.data[0], [
      'school', 'name', 'en', 'slogan', 'sloganEn', 'motto', 'address',
      'mailCoop', 'mailOffice', 'pillars', 'milestones', 'recruitmentRules',
    ])
  })
})
