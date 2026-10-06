import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'

export const CouncilMembers: CollectionConfig = {
  slug: 'council-members',
  labels: { singular: '理事会成员', plural: '理事会成员' },
  admin: {
    group: '协会内容',
    useAsTitle: 'name',
    defaultColumns: ['title', 'name', 'sort', '_status'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  fields: [
    { name: 'title', type: 'text', label: '职务', required: true },
    { name: 'name', type: 'text', label: '姓名', required: true },
    { name: 'sort', type: 'number', label: '显示顺序', defaultValue: 0 },
  ],
}
