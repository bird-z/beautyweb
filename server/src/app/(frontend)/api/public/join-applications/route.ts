import { getPayloadClient, json, apiError, options, corsHeaders } from '../../_lib/public'

export const dynamic = 'force-dynamic'

// 简易内存限流:同 IP 每分钟最多 3 次。单进程有效;多副本需换 Redis/Upstash。
const hits = new Map<string, { count: number; reset: number }>()
const WINDOW_MS = 60_000
const LIMIT = 3

function clientIp(request: Request) {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

function rateLimited(ip: string) {
  const now = Date.now()
  const cur = hits.get(ip)
  if (!cur || now > cur.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS })
    return false
  }
  if (cur.count >= LIMIT) return true
  cur.count += 1
  return false
}

export const OPTIONS = options

const REQUIRED = ['name', 'contact', 'college', 'major', 'year', 'department', 'message'] as const

export async function POST(request: Request) {
  const ip = clientIp(request)
  if (rateLimited(ip)) {
    return apiError(request, 429, 'rate_limited', 'Too many submissions, try later')
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError(request, 400, 'bad_request', 'Body must be JSON')
  }

  for (const key of REQUIRED) {
    const v = body[key]
    if (typeof v !== 'string' || !v.trim()) {
      return apiError(request, 400, 'bad_request', `Missing field: ${key}`)
    }
  }

  const interests = Array.isArray(body.interests)
    ? body.interests.filter((x): x is string => typeof x === 'string').map((value) => ({ value }))
    : []

  try {
    const payload = await getPayloadClient()
    const created = await payload.create({
      collection: 'join-applications',
      overrideAccess: false, // 走 access.create:()=>true,但字段校验仍生效
      data: {
        name: String(body.name).trim(),
        contact: String(body.contact).trim(),
        college: String(body.college).trim(),
        major: String(body.major).trim(),
        year: String(body.year).trim(),
        department: String(body.department).trim(),
        interests,
        message: String(body.message).trim(),
        // status 永远 pending;忽略客户端提交的 status
        status: 'pending',
      },
    })
    return json({ id: String(created.id) }, request, { status: 201 })
  } catch (e) {
    return apiError(request, 500, 'server', 'Failed to submit application')
  }
}
