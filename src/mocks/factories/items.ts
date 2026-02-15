import type { DashboardStats, Item, PaginatedResponse } from '@/api/types'
import { faker } from './index'

export function createItem(overrides?: Partial<Item>): Item {
  return {
    id: faker.string.uuid(),
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    status: faker.helpers.arrayElement(['active', 'archived'] as const),
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  }
}

export function createItemList(count = 10): Item[] {
  return Array.from({ length: count }, () => createItem())
}

export function createPaginatedItems(page = 1, size = 10, total = 25): PaginatedResponse<Item> {
  return {
    items: createItemList(Math.min(size, total - (page - 1) * size)),
    total,
    page,
    size,
    pages: Math.ceil(total / size),
  }
}

export function createDashboardStats(overrides?: Partial<DashboardStats>): DashboardStats {
  const total = overrides?.total_items ?? 25
  const active = overrides?.active_items ?? 18
  return {
    total_items: total,
    active_items: active,
    archived_items: overrides?.archived_items ?? total - active,
  }
}
