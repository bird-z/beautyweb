import { getPayloadClient, json, apiError, options, flatArray } from '../../_lib/public'

export const dynamic = 'force-dynamic'

export const OPTIONS = options

export async function GET(request: Request) {
  try {
    const payload = await getPayloadClient()
    const site = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: false })

    return json(
      [
        {
          school: site.school,
          name: site.name,
          en: site.en,
          slogan: site.slogan,
          sloganEn: site.sloganEn,
          motto: site.motto,
          address: site.address,
          mailCoop: site.mailCoop,
          mailOffice: site.mailOffice,
          pillars: (site.pillars ?? []).map((p) => ({ name: p.name, en: p.en, description: p.description })),
          milestones: (site.milestones ?? []).map((m) => ({ when: m.when, title: m.title, description: m.description })),
          recruitmentRules: flatArray(site.recruitmentRules),
        },
      ],
      request,
    )
  } catch (e) {
    return apiError(request, 500, 'server', 'Failed to load site settings')
  }
}
