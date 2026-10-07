import { getPayloadClient, json, apiError, options, listQuery, publishedWhere, mediaShape } from '../../_lib/public'

export const dynamic = 'force-dynamic'

export const OPTIONS = options

export async function GET(request: Request) {
  try {
    const payload = await getPayloadClient()
    const { id } = listQuery(request)
    const result = await payload.find({
      collection: 'wall-entries',
      depth: 1,
      limit: id ? 1 : 500,
      overrideAccess: false,
      sort: 'sort',
      where: publishedWhere(id ? { id: { equals: id } } : undefined),
    })
    return json(
      result.docs.map((d) => ({
        id: String(d.id),
        kind: d.kind,
        caption: d.caption,
        dateLabel: d.dateLabel,
        image: mediaShape(d.image),
        ratio: d.ratio ?? 1,
      })),
      request,
    )
  } catch {
    return apiError(request, 500, 'server', 'Failed to load wall entries')
  }
}
