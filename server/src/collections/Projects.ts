import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: '科创项目', plural: '科创项目' },
  admin: {
    group: '协会内容',
    useAsTitle: 'title',
    defaultColumns: ['title', 'stage', 'statusLabel', 'sort', '_status'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  fields: [
    { name: 'title', type: 'text', label: '项目名称', required: true },
    {
      name: 'stage',
      type: 'select',
      label: '项目阶段',
      required: true,
      options: [
        { label: '立项孵化', value: 'incubating' },
        { label: '开发进行时', value: 'building' },
        { label: '成果发布', value: 'released' },
      ],
    },
    { name: 'statusLabel', type: 'text', label: '状态文案', required: true },
    { name: 'description', type: 'textarea', label: '项目介绍', required: true },
    { name: 'sort', type: 'number', label: '显示顺序', defaultValue: 0 },
  ],
}
