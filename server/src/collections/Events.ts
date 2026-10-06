import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: '品牌活动', plural: '品牌活动' },
  admin: {
    group: '协会内容',
    useAsTitle: 'title',
    defaultColumns: ['term', 'title', 'statusLabel', 'sort', '_status'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  fields: [
    { name: 'term', type: 'text', label: '学期/时间段', required: true },
    { name: 'title', type: 'text', label: '活动名称', required: true },
    { name: 'statusLabel', type: 'text', label: '状态文案', required: true },
    { name: 'description', type: 'textarea', label: '活动介绍', required: true },
    { name: 'date', type: 'date', label: '活动日期', admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'sort', type: 'number', label: '显示顺序', defaultValue: 0 },
  ],
}
