import config from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'

export const dynamic = 'force-dynamic'

const allowedOrigins = new Set([
  'https://bioqif.com',
  'https://www.bioqif.com',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:8001',
  'http://127.0.0.1:8002',
  'http://localhost:8000',
  'http://localhost:8001',
  'http://localhost:8002',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

export function corsHeaders(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : 'https://www.bioqif.com'

  return {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
}

export function options(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}

export function json(data: unknown, request: Request, init?: ResponseInit) {
  return Response.json({ data }, { ...init, headers: corsHeaders(request) })
}

export function apiError(
  request: Request,
  status: number,
  code: 'bad_request' | 'not_found' | 'rate_limited' | 'server' | 'timeout' | 'unknown',
  message: string,
) {
  return Response.json(
    { error: { code, message } },
    { status, headers: corsHeaders(request) },
  )
}

export async function getPayloadClient() {
  return getPayload({ config })
}

export function listQuery(request: Request, slugKey = 'slug') {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const slug = url.searchParams.get(slugKey)
  return { id, slug }
}

export function publishedWhere(extra?: Where | Where[]): Where {
  const and: Where[] = [{ _status: { equals: 'published' } }]
  if (Array.isArray(extra)) and.push(...extra)
  else if (extra) and.push(extra)
  return { and }
}

/** 把 Payload array[{value}] 字段摊平成 string[] */
export function flatArray(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return values
    .map((v) => (typeof v === 'object' && v !== null && 'value' in v ? String((v as { value: unknown }).value) : null))
    .filter((v): v is string => typeof v === 'string')
}

/** 把 upload 字段压成 {url,alt,width,height} 或 null */
export function mediaShape(media: unknown): { url: string; alt: string | null; width: number | null; height: number | null } | null {
  if (typeof media !== 'object' || media === null) return null
  const m = media as { url?: string; alt?: string; width?: number; height?: number }
  if (typeof m.url !== 'string' || !m.url) return null
  return { url: m.url, alt: m.alt ?? null, width: m.width ?? null, height: m.height ?? null }
}
