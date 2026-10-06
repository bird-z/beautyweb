import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: '图片',
    plural: '图片库',
  },
  admin: {
    group: '内容管理',
    useAsTitle: 'title',
    defaultColumns: ['filename', 'title', 'updatedAt'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '图片标题',
    },
    {
      name: 'alt',
      type: 'text',
      label: '图片说明',
      required: true,
      admin: {
        description: '用于无障碍阅读和图片无法加载时的替代文字。',
      },
    },
  ],
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'card',
        width: 800,
        height: 500,
        position: 'centre',
      },
      {
        name: 'thumbnail',
        width: 400,
        height: 250,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/*'],
  },
}
