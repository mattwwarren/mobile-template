import { createDashboardStats, createItemList } from './items'

// Pre-generated data — always the same due to seeded faker
export const dataset = {
  items: createItemList(25),
  stats: createDashboardStats(),
}
