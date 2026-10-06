import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'

export const Studios: CollectionConfig = {
  slug: 'studios',
  labels: { singular: '工作室', plural: '工作室' },
  admin: {
    group: '协会内容',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'sort', '_status'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: '工作室名称',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: '链接标识',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    { name: 'en', type: 'text', label: '英文名称', required: true },
    { name: 'description', type: 'textarea', label: '工作室介绍', required: true },
    {
      name: 'tags',
      type: 'array',
      label: '标签',
      fields: [{ name: 'value', type: 'text', label: '标签', required: true }],
    },
    { name: 'sort', type: 'number', label: '显示顺序', defaultValue: 0 },
  ],
}
