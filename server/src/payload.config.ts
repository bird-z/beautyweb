import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { zh } from '@payloadcms/translations/languages/zh'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Articles } from './collections/Articles'
import { CouncilMembers } from './collections/CouncilMembers'
import { Departments } from './collections/Departments'
import { Events } from './collections/Events'
import { JoinApplications } from './collections/JoinApplications'
import { Members } from './collections/Members'
import { Notes } from './collections/Notes'
import { Projects } from './collections/Projects'
import { Studios } from './collections/Studios'
import { WallEntries } from './collections/WallEntries'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · 生物启扉协会内容管理',
    },
  },
  collections: [
    Articles,
    Categories,
    Media,
    Users,
    Departments,
    CouncilMembers,
    Studios,
    Projects,
    Events,
    Members,
    WallEntries,
    Notes,
    JoinApplications,
  ],
  globals: [SiteSettings],
  cors: [
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
  ],
  csrf: [
    'https://cms.bioqif.com',
    'https://manage.bioqif.com',
    'http://localhost:3000',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8001',
    'http://127.0.0.1:8002',
    'http://localhost:8000',
    'http://localhost:8001',
    'http://localhost:8002',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  db: postgresAdapter({
    // 脚本/CI 可通过 PAYLOAD_DB_PUSH=0 关闭自动 schema push(dev server 默认开)
    push: process.env.PAYLOAD_DB_PUSH !== '0',
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  editor: lexicalEditor(),
  i18n: {
    supportedLanguages: {
      zh,
    },
  },
  endpoints: [
    {
      path: '/article-view/:id',
      method: 'post',
      handler: async (req) => {
        const id = String(req.routeParams?.id || '')
        if (!id) return Response.json({ error: 'Missing article id' }, { status: 400 })

        try {
          const article = await req.payload.findByID({
            collection: 'articles',
            id,
            depth: 0,
            overrideAccess: true,
          })

          if (article._status !== 'published') {
            return Response.json({ error: 'Article not found' }, { status: 404 })
          }

          const views = Number(article.views || 0) + 1
          await req.payload.update({
            collection: 'articles',
            id,
            data: { views },
            depth: 0,
            overrideAccess: true,
          })

          return Response.json({ views })
        } catch {
          return Response.json({ error: 'Article not found' }, { status: 404 })
        }
      },
    },
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
