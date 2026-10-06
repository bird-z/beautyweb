import type { CollectionConfig } from 'payload'

import { adminsOnly, authenticated } from '../access'

export const JoinApplications: CollectionConfig = {
  slug: 'join-applications',
  labels: { singular: '加入申请', plural: '加入申请' },
  admin: {
    group: '申请管理',
    useAsTitle: 'name',
    defaultColumns: ['name', 'college', 'year', 'status', 'createdAt'],
  },
  access: {
    create: () => true,
    read: adminsOnly,
    update: authenticated,
    delete: adminsOnly,
  },
  fields: [
    { name: 'name', type: 'text', label: '姓名', required: true },
    { name: 'contact', type: 'text', label: '联系方式', required: true },
    { name: 'college', type: 'text', label: '学院', required: true },
    { name: 'major', type: 'text', label: '专业', required: true },
    { name: 'year', type: 'text', label: '年级', required: true },
    { name: 'department', type: 'text', label: '意向部门', required: true },
    {
      name: 'interests',
      type: 'array',
      label: '兴趣方向',
      fields: [{ name: 'value', type: 'text', label: '方向', required: true }],
    },
    { name: 'message', type: 'textarea', label: '申请理由', required: true },
    {
      name: 'status',
      type: 'select',
      label: '处理状态',
      defaultValue: 'pending',
      options: [
        { label: '待处理', value: 'pending' },
        { label: '已联系', value: 'contacted' },
        { label: '已通过', value: 'accepted' },
        { label: '未通过', value: 'rejected' },
      ],
      access: { update: ({ req }) => Boolean(req.user) },
    },
  ],
}
