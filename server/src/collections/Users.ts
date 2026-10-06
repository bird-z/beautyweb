import type { CollectionConfig } from 'payload'

import { adminsOnly } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: '后台用户',
    plural: '后台用户',
  },
  admin: {
    group: '系统管理',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
  },
  auth: true,
  access: {
    create: adminsOnly,
    delete: adminsOnly,
    read: ({ req }) => {
      if ((req.user as { role?: string } | null)?.role === 'admin') return true
      return { id: { equals: req.user?.id } }
    },
    update: ({ req }) => {
      if ((req.user as { role?: string } | null)?.role === 'admin') return true
      return { id: { equals: req.user?.id } }
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: '姓名',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      label: '权限角色',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: '管理员', value: 'admin' },
        { label: '内容编辑', value: 'editor' },
      ],
      access: {
        update: ({ req }) => (req.user as { role?: string } | null)?.role === 'admin',
      },
    },
  ],
}
