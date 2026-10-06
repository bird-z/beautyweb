import config from '@payload-config'
import { getPayload } from 'payload'

type DirectusCategory = {
  id: number
  name: string
  slug: string
  sort?: number
}

type DirectusArticle = {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  cover?: string
  category?: DirectusCategory
  source?: string
  author?: string
  editor?: string
  reviewer?: string
  published_at?: string
  featured?: boolean
  views?: number
}

const directusURL = process.env.DIRECTUS_URL || 'https://cms.bioqif.com'

function htmlToLexical(html: string) {
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()

  const paragraphs = text.split(/\n{2,}/).filter(Boolean)

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: paragraphs.map((paragraph) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: null,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: paragraph.trim(),
            version: 1,
          },
        ],
      })),
    },
  } as const
}

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${directusURL}${path}`)
  if (!response.ok) throw new Error(`Directus request failed: ${response.status} ${path}`)
  return response.json() as Promise<T>
}

async function main() {
  const payload = await getPayload({ config })

  const categoryResponse = await fetchJSON<{ data: DirectusCategory[] }>(
    '/items/categories?fields=id,name,slug,sort&limit=-1',
  )
  const articleResponse = await fetchJSON<{ data: DirectusArticle[] }>(
    '/items/articles?fields=id,title,slug,summary,content,cover,category.id,category.name,category.slug,author,editor,reviewer,published_at,featured,views&filter%5Bstatus%5D%5B_eq%5D=published&limit=-1',
  )

  const categoryIDs = new Map<number, number>()

  for (const category of categoryResponse.data) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: category.slug } },
      limit: 1,
    })

    const saved =
      existing.docs[0] ||
      (await payload.create({
        collection: 'categories',
        data: {
          name: category.name,
          slug: category.slug,
          sort: category.sort || 0,
        },
      }))

    categoryIDs.set(category.id, saved.id)
  }

  for (const article of articleResponse.data) {
    const existing = await payload.find({
      collection: 'articles',
      where: { slug: { equals: article.slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      console.log(`跳过已存在文章：${article.title}`)
      continue
    }

    const categoryID = article.category
      ? categoryIDs.get(article.category.id)
      : undefined
    if (!categoryID) {
      console.warn(`跳过缺少有效栏目的文章：${article.title}`)
      continue
    }

    let coverID: number | undefined
    if (article.cover) {
      const response = await fetch(`${directusURL}/assets/${article.cover}`)
      if (response.ok) {
        const data = Buffer.from(await response.arrayBuffer())
        const contentType = response.headers.get('content-type') || 'image/jpeg'
        const filename =
          response.headers
            .get('content-disposition')
            ?.match(/filename="?([^"]+)"?/)?.[1] || `${article.cover}.jpg`

        const media = await payload.create({
          collection: 'media',
          data: {
            alt: article.title,
            title: article.title,
          },
          file: {
            data,
            mimetype: contentType,
            name: filename,
            size: data.length,
          },
        })
        coverID = media.id
      }
    }

    await payload.create({
      collection: 'articles',
      draft: false,
      overrideAccess: true,
      data: {
        _status: 'published',
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: htmlToLexical(article.content),
        category: [categoryID],
        cover: coverID,
        articleSource: article.source || article.author || '生物启扉协会',
        author: article.author || '生物启扉协会',
        editor: article.editor || article.author || '生物启扉协会',
        reviewer: article.reviewer || '生物启扉协会',
        publishedAt: article.published_at || new Date().toISOString(),
        featured: Boolean(article.featured),
        views: Number(article.views || 0),
      },
    })

    console.log(`已迁移：${article.title}`)
  }

  console.log('Directus 内容迁移完成。')
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
