import { getPayloadClient, json, apiError, options, listQuery, publishedWhere, flatArray } from '../../_lib/public'

export const dynamic = 'force-dynamic'

export const OPTIONS = options

export async function GET(request: Request) {
  try {
    const payload = await getPayloadClient()
    const url = new URL(request.url)
    const { id } = listQuery(request)
    const featured = url.searchParams.get('featured')
    const result = await payload.find({
      collection: 'members',
      depth: 1,
      limit: id ? 1 : 500,
      overrideAccess: false,
      sort: 'name',
      where: publishedWhere([
        ...(id ? [{ id: { equals: id } }] : []),
        ...(featured === 'true' ? [{ featured: { equals: true } }] : []),
      ]),
    })
    return json(
      result.docs.map((d) => {
        const dept = typeof d.department === 'object' && d.department
          ? { id: String(d.department.id), name: d.department.name, en: d.department.en }
          : null
        return {
          id: String(d.id),
          name: d.name,
          pinyin: d.pinyin ?? null,
          tag: d.tag,
          department: dept,
          college: d.college,
          year: d.year,
          bio: d.bio,
          quote: d.quote,
          tags: flatArray(d.tags),
          featured: Boolean(d.featured),
        }
      }),
      request,
    )
  } catch {
    return apiError(request, 500, 'server', 'Failed to load members')
  }
}
