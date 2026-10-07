import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { getPayloadClient, json, apiError, options, listQuery, publishedWhere } from '../../_lib/public'

export const dynamic = 'force-dynamic'

export const OPTIONS = options

export async function GET(request: Request) {
  try {
    const payload = await getPayloadClient()
    const { id, slug } = listQuery(request)
    const detail = Boolean(id || slug)
    const result = await payload.find({
      collection: 'notes',
      depth: 0,
      limit: detail ? 1 : 500,
      overrideAccess: false,
      sort: '-date',
      where: publishedWhere([
        ...(id ? [{ id: { equals: id } }] : []),
        ...(slug ? [{ slug: { equals: slug } }] : []),
      ]),
    })
    return json(
      result.docs.map((d) => ({
        id: String(d.id),
        slug: d.slug,
        category: d.category,
        title: d.title,
        date: d.date,
        lede: d.lede,
        // 列表也返回 content,保持契约单一形状;前端详情页才渲染
        content: d.content ? convertLexicalToHTML({ data: d.content }) : '',
      })),
      request,
    )
  } catch {
    return apiError(request, 500, 'server', 'Failed to load notes')
  }
}
