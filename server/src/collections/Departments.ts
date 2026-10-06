import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'

export const Departments: CollectionConfig = {
  slug: 'departments',
  labels: { singular: '部门', plural: '部门' },
  admin: {
    group: '协会内容',
    useAsTitle: 'name',
    defaultColumns: ['name', 'en', 'sort', '_status'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  fields: [
    { name: 'name', type: 'text', label: '部门名称', required: true },
    { name: 'en', type: 'text', label: '英文名称', required: true },
    { name: 'description', type: 'textarea', label: '部门介绍', required: true },
    { name: 'sort', type: 'number', label: '显示顺序', defaultValue: 0 },
  ],
}
