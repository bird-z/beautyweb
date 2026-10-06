import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'

export const Notes: CollectionConfig = {
  slug: 'notes',
  labels: { singular: '知识笔记', plural: '知识笔记' },
  admin: {
    group: '协会内容',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'date', '_status'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  fields: [
    { name: 'slug', type: 'text', label: '链接标识', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'category', type: 'text', label: '分类', required: true },
    { name: 'title', type: 'text', label: '标题', required: true },
    { name: 'date', type: 'date', label: '发布日期', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'lede', type: 'textarea', label: '导语', required: true },
    { name: 'content', type: 'richText', label: '正文', required: true },
  ],
}
