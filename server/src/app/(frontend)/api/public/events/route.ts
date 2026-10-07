import { getPayloadClient, json, apiError, options, listQuery, publishedWhere } from '../../_lib/public'

export const dynamic = 'force-dynamic'

export const OPTIONS = options

export async function GET(request: Request) {
  try {
    const payload = await getPayloadClient()
    const { id } = listQuery(request)
    const result = await payload.find({
      collection: 'events',
      depth: 0,
      limit: id ? 1 : 500,
      overrideAccess: false,
      sort: '-date,sort',
      where: publishedWhere(id ? { id: { equals: id } } : undefined),
    })
    return json(
      result.docs.map((d) => ({
        id: String(d.id),
        term: d.term,
        title: d.title,
        statusLabel: d.statusLabel,
        description: d.description,
        date: d.date ?? null,
      })),
      request,
    )
  } catch {
    return apiError(request, 500, 'server', 'Failed to load events')
  }
}
