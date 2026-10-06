import type { Access } from 'payload'

type UserWithRole = {
  role?: 'admin' | 'editor'
}

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const adminsOnly: Access = ({ req }) =>
  (req.user as UserWithRole | null)?.role === 'admin'

export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true

  return {
    _status: {
      equals: 'published',
    },
  }
}
