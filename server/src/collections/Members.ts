import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'

export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: '会员档案', plural: '会员档案' },
  admin: {
    group: '协会内容',
    useAsTitle: 'name',
    defaultColumns: ['name', 'department', 'college', 'year', '_status'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated,
  },
  defaultPopulate: {
    name: true,
    pinyin: true,
    tag: true,
    department: true,
    college: true,
    year: true,
    bio: true,
    quote: true,
    tags: true,
    featured: true,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  fields: [
    { name: 'name', type: 'text', label: '姓名', required: true },
    { name: 'pinyin', type: 'text', label: '拼音/英文名' },
    { name: 'tag', type: 'text', label: '方向标签', required: true },
    {
      name: 'department',
      type: 'relationship',
      label: '所属部门',
      relationTo: 'departments',
      required: true,
    },
    { name: 'college', type: 'text', label: '学院', required: true },
    { name: 'year', type: 'text', label: '年级', required: true },
    { name: 'bio', type: 'textarea', label: '成员简介', required: true },
    { name: 'quote', type: 'textarea', label: '成员寄语', required: true },
    {
      name: 'tags',
      type: 'array',
      label: '兴趣标签',
      fields: [{ name: 'value', type: 'text', label: '标签', required: true }],
    },
    { name: 'featured', type: 'checkbox', label: '首页展示', defaultValue: false },
  ],
}
