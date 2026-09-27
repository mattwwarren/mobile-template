import { USE_MOCKS } from '@/config'
import { mockItemsApi } from '@/mocks/mock-api'
import { fetchApi } from './client'
import type { DashboardStats, Item, ItemCreate, ItemUpdate, PaginatedResponse } from './types'

export interface ItemListParams {
  page?: number
  size?: number
  search?: string
}

const realItemsApi = {
  list: (params: ItemListParams = {}) => {
    const searchParams = new URLSearchParams()
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('size', String(params.size ?? 10))
    if (params.search) {
      searchParams.set('search', params.search)
    }
    return fetchApi<PaginatedResponse<Item>>(`/items?${searchParams.toString()}`)
  },

  get: (id: string) => fetchApi<Item>(`/items/${id}`),

  create: (data: ItemCreate) =>
    fetchApi<Item>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: ItemUpdate) =>
    fetchApi<Item>(`/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => fetchApi<void>(`/items/${id}`, { method: 'DELETE' }),

  dashboardStats: () => fetchApi<DashboardStats>('/dashboard/stats'),
}

export const itemsApi = USE_MOCKS ? mockItemsApi : realItemsApi
