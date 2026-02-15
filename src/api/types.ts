// Type aliases from generated OpenAPI types
// After running `npm run generate:types`, import types here
// Example:
// import type { components } from './generated/types'
// export type User = components['schemas']['UserRead']

// Placeholder types until OpenAPI spec is generated
export type Item = {
  id: string
  title: string
  description: string
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

export type ItemCreate = {
  title: string
  description: string
}

export type ItemUpdate = Partial<ItemCreate> & {
  status?: 'active' | 'archived'
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export type DashboardStats = {
  total_items: number
  active_items: number
  archived_items: number
}
