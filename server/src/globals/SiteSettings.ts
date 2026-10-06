import type { GlobalConfig } from 'payload'

import { authenticated } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '站点信息',
  admin: { group: '协会内容' },
  access: {
    read: () => true,
    update: authenticated,
  },
  fields: [
    { name: 'school', type: 'text', label: '学校', required: true },
    { name: 'name', type: 'text', label: '协会名称', required: true },
    { name: 'en', type: 'text', label: '英文名称', required: true },
    { name: 'slogan', type: 'text', label: '宣传语', required: true },
    { name: 'sloganEn', type: 'text', label: '英文宣传语', required: true },
    { name: 'motto', type: 'textarea', label: '协会寄语', required: true },
    { name: 'address', type: 'text', label: '地址', required: true },
    { name: 'mailCoop', type: 'email', label: '合作邮箱', required: true },
    { name: 'mailOffice', type: 'email', label: '事务邮箱', required: true },
    {
      name: 'pillars',
      type: 'array',
      label: '发展方向',
      fields: [
        { name: 'name', type: 'text', label: '名称', required: true },
        { name: 'en', type: 'text', label: '英文名称', required: true },
        { name: 'description', type: 'textarea', label: '介绍', required: true },
      ],
    },
    {
      name: 'milestones',
      type: 'array',
      label: '发展历程',
      fields: [
        { name: 'when', type: 'text', label: '时间', required: true },
        { name: 'title', type: 'text', label: '标题', required: true },
        { name: 'description', type: 'textarea', label: '介绍', required: true },
      ],
    },
    {
      name: 'recruitmentRules',
      type: 'array',
      label: '招募说明',
      fields: [{ name: 'value', type: 'text', label: '说明', required: true }],
    },
  ],
}
