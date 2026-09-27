import type { ItemListParams } from '@/api/items'
import { ApiError } from '@/api/client'
import type { DashboardStats, Item, ItemCreate, ItemUpdate, PaginatedResponse } from '@/api/types'
import { createDashboardStats, createItem, createItemList } from './factories/items'

// Mutable state for testing create/update/delete
let items: Item[] = createItemList(25)

function delay(ms = 50): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/** Reset mock state to initial data. Call in beforeEach. */
export function resetMockApi(): void {
  items = createItemList(25)
}

export const mockItemsApi = {
  list: async (params: ItemListParams = {}): Promise<PaginatedResponse<Item>> => {
    await delay()
    const page = params.page ?? 1
    const size = params.size ?? 10
    let filtered = items

    if (params.search) {
      const query = params.search.toLowerCase()
      filtered = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      )
    }

    const start = (page - 1) * size
    const paged = filtered.slice(start, start + size)

    return {
      items: paged,
      total: filtered.length,
      page,
      size,
      pages: Math.ceil(filtered.length / size),
    }
  },

  get: async (id: string): Promise<Item> => {
    await delay()
    const item = items.find((i) => i.id === id)
    if (!item) {
      throw new ApiError(404, 'Not Found', `Item ${id} not found`)
    }
    return item
  },

  create: async (data: ItemCreate): Promise<Item> => {
    await delay()
    const item = createItem({
      title: data.title,
      description: data.description,
      status: 'active',
    })
    items = [item, ...items]
    return item
  },

  update: async (id: string, data: ItemUpdate): Promise<Item> => {
    await delay()
    const index = items.findIndex((i) => i.id === id)
    if (index === -1) {
      throw new ApiError(404, 'Not Found', `Item ${id} not found`)
    }
    const updated = { ...items[index], ...data, updated_at: new Date().toISOString() } as Item
    items = items.map((i) => (i.id === id ? updated : i))
    return updated
  },

  delete: async (id: string): Promise<void> => {
    await delay()
    items = items.filter((i) => i.id !== id)
  },

  dashboardStats: async (): Promise<DashboardStats> => {
    await delay()
    const active = items.filter((i) => i.status === 'active').length
    return createDashboardStats({
      total_items: items.length,
      active_items: active,
      archived_items: items.length - active,
    })
  },
}
