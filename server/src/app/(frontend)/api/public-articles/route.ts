import config from '@payload-config'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { getPayload } from 'payload'

import type { Category } from '@/payload-types'

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

function corsHeaders(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : 'https://www.bioqif.com'

  return {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  })
}

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const slug = url.searchParams.get('slug')

  const result = await payload.find({
    collection: 'articles',
    depth: 2,
    limit: id || slug ? 1 : 100,
    overrideAccess: false,
    sort: '-publishedAt',
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        ...(id ? [{ id: { equals: id } }] : []),
        ...(slug ? [{ slug: { equals: slug } }] : []),
      ],
    },
  })

  const articles = result.docs.map((article) => {
    // 栏目为多选：返回全部已填充栏目（此前用 find 只取第一个，
    // 导致 BANNER 不在首位时前端匹配不到）
    const categories = article.category
      .filter(
        (value): value is Category => typeof value === 'object' && value !== null,
      )
      .map((value) => ({
        name: value.name,
        slug: value.slug,
      }))
    const cover =
      typeof article.cover === 'object' && article.cover
        ? article.cover
        : null

    return {
      id: String(article.id),
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      content: convertLexicalToHTML({
        data: article.content,
      }),
      cover: cover?.url || null,
      category: categories,
      author: article.author || '生物启扉协会',
      source: article.articleSource || '生物启扉协会',
      editor: article.editor || article.author || '生物启扉协会',
      reviewer: article.reviewer || '生物启扉协会',
      published_at: article.publishedAt,
      featured: article.featured,
      views: article.views || 0,
      date_created: article.createdAt,
    }
  })

  return Response.json(
    {
      data: articles,
    },
    {
      headers: corsHeaders(request),
    },
  )
}
