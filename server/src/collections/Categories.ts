import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: '新闻栏目',
    plural: '新闻栏目',
  },
  admin: {
    group: '内容管理',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'sort'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: '栏目名称',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: '栏目标识',
      required: true,
      unique: true,
      admin: {
        description: '使用小写英文、数字和连字符，例如 association-news。',
      },
    },
    {
      name: 'sort',
      type: 'number',
      label: '显示顺序',
      defaultValue: 0,
    },
  ],
}
