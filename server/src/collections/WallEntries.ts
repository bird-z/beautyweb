import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'

export const WallEntries: CollectionConfig = {
  slug: 'wall-entries',
  labels: { singular: '校园墙内容', plural: '校园墙内容' },
  admin: {
    group: '协会内容',
    useAsTitle: 'caption',
    defaultColumns: ['kind', 'caption', 'dateLabel', 'sort', '_status'],
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
      name: 'kind',
      type: 'select',
      label: '内容类型',
      required: true,
      options: [
        { label: '活动', value: '活动' },
        { label: '校园', value: '校园' },
        { label: '观察', value: '观察' },
      ],
    },
    { name: 'caption', type: 'text', label: '图注', required: true },
    { name: 'dateLabel', type: 'text', label: '日期文案', required: true },
    { name: 'image', type: 'upload', label: '图片', relationTo: 'media' },
    { name: 'ratio', type: 'number', label: '宽高比', min: 0.1, defaultValue: 1 },
    { name: 'sort', type: 'number', label: '显示顺序', defaultValue: 0 },
  ],
}
