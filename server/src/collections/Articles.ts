import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: {
    singular: '新闻文章',
    plural: '新闻管理',
  },
  admin: {
    group: '内容管理',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'articleSource', '_status', 'publishedAt', 'updatedAt'],
    description: '在这里撰写、预览并发布协会新闻。',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    category: true,
    cover: true,
  },
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
    },
    maxPerDoc: 30,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: '新闻标题',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: '链接标识',
      required: true,
      unique: true,
      admin: {
        description: '使用小写英文、数字和连字符；发布后尽量不要修改。',
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      label: '新闻栏目',
      relationTo: 'categories',
      hasMany: true,
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      label: '封面图片',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      label: '新闻摘要',
      required: true,
      maxLength: 300,
    },
    {
      name: 'articleSource',
      type: 'text',
      label: '来源',
      defaultValue: '生物启扉协会',
      admin: {
        description: '文章页标题下方将显示为：来源：xxx',
      },
    },
    {
      name: 'author',
      type: 'text',
      label: '作者',
      defaultValue: '生物启扉协会',
      admin: {
        description: '文章页底部将显示为：作者：xxx',
      },
    },
    {
      name: 'editor',
      type: 'text',
      label: '编辑',
      defaultValue: '生物启扉协会',
      admin: {
        description: '文章页底部将显示为：编辑：xxx',
      },
    },
    {
      name: 'reviewer',
      type: 'text',
      label: '审核',
      defaultValue: '生物启扉协会',
      admin: {
        description: '文章页底部将显示为：审核：xxx',
      },
    },
    {
      name: 'content',
      type: 'richText',
      label: '新闻正文',
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: '发布时间',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) return new Date()
            return value
          },
        ],
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: '首页推荐',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'views',
      type: 'number',
      label: '浏览量',
      defaultValue: 0,
      min: 0,
      access: {
        create: () => false,
        update: ({ req }) => Boolean(req.user),
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: '由网站自动统计，无需手动修改。',
      },
    },
  ],
}
