import config from '../src/payload.config'
import { getPayload } from 'payload'

import { DEPARTMENTS, COUNCIL, EVENTS, PROJECTS, STUDIOS } from '../../web/src/data/content.js'
import { NOTES } from '../../web/src/data/notes.js'
import { ROSTER, WALL } from '../../web/src/data/people.js'
import { MILESTONES, ORG, PILLARS } from '../../web/src/data/site.js'

const published = { _status: 'published' as const }

type CollectionName = string

type Where = Record<string, unknown>

async function upsert(
  payload: any,
  collection: CollectionName,
  where: Where,
  data: Record<string, unknown>,
) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where,
  })
  const existing = result.docs[0]

  if (existing) {
    // update 不携带 _status,避免把管理员改过的发布状态回写
    const { _status, ...rest } = data
    return payload.update({
      collection,
      id: existing.id,
      data: rest,
      depth: 0,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection,
    data,
    depth: 0,
    overrideAccess: true,
  })
}

function tags(values: string[]) {
  return values.map((value) => ({ value }))
}

function simpleLexical(blocks: unknown[][]) {
  const children: any[] = []

  for (const block of blocks) {
    const [kind, value] = block
    if (kind === 'ul' && Array.isArray(value)) {
      children.push({
        type: 'list',
        listType: 'bullet',
        tag: 'ul',
        start: 1,
        format: '',
        indent: 0,
        version: 1,
        children: value.map((item) => ({
          type: 'listitem',
          value: 1,
          format: '',
          indent: 0,
          version: 1,
          children: [{ type: 'text', text: String(item), version: 1 }],
        })),
      })
      continue
    }

    children.push({
      type: kind === 'h' ? 'heading' : 'paragraph',
      ...(kind === 'h' ? { tag: 'h2' } : {}),
      format: '',
      indent: 0,
      version: 1,
      children: [{ type: 'text', text: String(value), version: 1 }],
    })
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children,
    },
  }
}

async function seed() {
  const payload = await getPayload({ config })

  const departmentIds = new Map<string, number>()
  for (const [sort, department] of DEPARTMENTS.entries()) {
    const item = await upsert(payload, 'departments', { name: { equals: department.name } }, {
      ...published,
      name: department.name,
      en: department.en,
      description: department.text,
      sort,
    })
    departmentIds.set(department.name, item.id as number)
  }

  for (const [sort, member] of COUNCIL.entries()) {
    await upsert(payload, 'council-members', {
      and: [{ title: { equals: member.title } }, { name: { equals: member.name } }],
    }, {
      ...published,
      title: member.title,
      name: member.name,
      sort,
    })
  }

  for (const [sort, studio] of STUDIOS.entries()) {
    await upsert(payload, 'studios', { slug: { equals: studio.key } }, {
      ...published,
      slug: studio.key,
      name: studio.name,
      en: studio.en,
      description: studio.text,
      tags: tags(studio.tags),
      sort,
    })
  }

  for (const [sort, project] of PROJECTS.entries()) {
    const stage = ['incubating', 'building', 'released'][project.stage]
    await upsert(payload, 'projects', { title: { equals: project.title } }, {
      ...published,
      title: project.title,
      stage,
      statusLabel: project.status,
      description: project.text,
      sort,
    })
  }

  for (const [sort, eventGroup] of EVENTS.entries()) {
    for (const [itemSort, event] of eventGroup.items.entries()) {
      await upsert(payload, 'events', {
        and: [{ term: { equals: eventGroup.term } }, { title: { equals: event.title } }],
      }, {
        ...published,
        term: eventGroup.term,
        title: event.title,
        statusLabel: event.status,
        description: event.text,
        sort: sort * 100 + itemSort,
      })
    }
  }

  for (const member of ROSTER.filter((item) => !(item as { demo?: boolean }).demo)) {
    const existing = await payload.find({
      collection: 'members',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { name: { equals: member.name } },
    })
    const base = {
      name: member.name,
      pinyin: member.pinyin,
      tag: member.tag,
      department: departmentIds.get(member.dept),
      college: member.college,
      year: member.year,
      bio: member.bio,
      quote: member.quote,
      tags: tags([member.tag]),
    }
    if (existing.docs[0]) {
      // update 不改 featured/_status,避免覆盖管理员调整
      await payload.update({
        collection: 'members',
        id: existing.docs[0].id,
        data: base as any,
        depth: 0,
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'members',
        data: { _status: 'published' as const, ...base, featured: true } as any,
        depth: 0,
        overrideAccess: true,
      })
    }
  }

  for (const [sort, entry] of WALL.entries()) {
    // 占位条目(索引 >= 7,文案"待补充")保持 draft,不进公开 API
    const status = (sort >= 7 ? { _status: 'draft' } : { _status: 'published' }) as { _status: 'draft' | 'published' }
    await upsert(payload, 'wall-entries', {
      and: [{ caption: { equals: entry.caption } }, { sort: { equals: sort } }],
    }, {
      ...status,
      kind: entry.kind,
      caption: entry.caption,
      dateLabel: entry.date,
      ratio: entry.ratio,
      sort,
    })
  }

  for (const note of NOTES) {
    await upsert(payload, 'notes', { slug: { equals: note.id } }, {
      ...published,
      slug: note.id,
      category: note.cat,
      title: note.title,
      date: note.date,
      lede: note.lede,
      content: simpleLexical(note.blocks),
    })
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      school: ORG.school,
      name: ORG.name,
      en: ORG.en,
      slogan: ORG.slogan,
      sloganEn: ORG.sloganEn,
      motto: ORG.motto,
      address: ORG.address,
      mailCoop: ORG.mailCoop,
      mailOffice: ORG.mailOffice,
      pillars: PILLARS.map((item) => ({ name: item.name, en: item.en, description: item.text })),
      milestones: MILESTONES.map((item) => ({ when: item.when, title: item.title, description: item.text })),
      recruitmentRules: [
        '招募对象：江西农业大学全日制在校学生',
        '专业与年级不限，从热爱出发',
        '集中招新时间以协会正式通知为准',
      ].map((value) => ({ value })),
    },
    overrideAccess: true,
  })

  payload.logger.info('Content seed completed')
  await payload.db.destroy?.()
}

seed().catch(async (error) => {
  console.error(error)
  process.exitCode = 1
})
