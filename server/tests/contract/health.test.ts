import { describe, it, expect } from 'vitest'
import { getJSON, serverUp } from './helpers'

describe.skipIf(!(await serverUp()))('GET /api/health', () => {

  it('返回 {ok:true} + CORS', async () => {
    const { res, body } = await getJSON('/api/health')
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy()
  })
})
