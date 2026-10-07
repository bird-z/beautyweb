import { getPayloadClient, json, apiError, options, listQuery, publishedWhere, flatArray } from '../../_lib/public'

export const dynamic = 'force-dynamic'

export const OPTIONS = options

export async function GET(request: Request) {
  try {
    const payload = await getPayloadClient()
    const { id, slug } = listQuery(request)
    const result = await payload.find({
      collection: 'studios',
      depth: 0,
      limit: id || slug ? 1 : 500,
      overrideAccess: false,
      sort: 'sort',
      where: publishedWhere([
        ...(id ? [{ id: { equals: id } }] : []),
        ...(slug ? [{ slug: { equals: slug } }] : []),
      ]),
    })
    return json(
      result.docs.map((d) => ({
        id: String(d.id),
        slug: d.slug,
        name: d.name,
        en: d.en,
        description: d.description,
        tags: flatArray(d.tags),
      })),
      request,
    )
  } catch {
    return apiError(request, 500, 'server', 'Failed to load studios')
  }
}
