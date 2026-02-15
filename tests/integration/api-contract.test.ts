import { itemsApi } from '@/api/items'
import type { DashboardStats, Item, ItemCreate, ItemUpdate, PaginatedResponse } from '@/api/types'

// Mock the fetchApi to capture requests without making real network calls
jest.mock('@/api/client', () => ({
  fetchApi: jest.fn(),
  API_BASE_URL: 'http://localhost:4455',
}))

const { fetchApi } = jest.requireMock<{ fetchApi: jest.Mock }>('@/api/client')

describe('API Contract: Items', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /items - List', () => {
    it('constructs correct URL with default pagination', async () => {
      const mockResponse: PaginatedResponse<Item> = {
        items: [],
        total: 0,
        page: 1,
        size: 10,
        pages: 0,
      }
      fetchApi.mockResolvedValue(mockResponse)

      await itemsApi.list()

      expect(fetchApi).toHaveBeenCalledWith('/items?page=1&size=10')
    })

    it('constructs correct URL with custom pagination', async () => {
      const mockResponse: PaginatedResponse<Item> = {
        items: [],
        total: 0,
        page: 2,
        size: 20,
        pages: 0,
      }
      fetchApi.mockResolvedValue(mockResponse)

      await itemsApi.list({ page: 2, size: 20 })

      expect(fetchApi).toHaveBeenCalledWith('/items?page=2&size=20')
    })

    it('includes search parameter when provided', async () => {
      const mockResponse: PaginatedResponse<Item> = {
        items: [],
        total: 0,
        page: 1,
        size: 10,
        pages: 0,
      }
      fetchApi.mockResolvedValue(mockResponse)

      await itemsApi.list({ search: 'test query' })

      expect(fetchApi).toHaveBeenCalledWith('/items?page=1&size=10&search=test+query')
    })

    it('response satisfies PaginatedResponse<Item> type', async () => {
      const mockItem: Item = {
        id: '123',
        title: 'Test Item',
        description: 'Test Description',
        status: 'active',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      }
      const mockResponse: PaginatedResponse<Item> = {
        items: [mockItem],
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      }
      fetchApi.mockResolvedValue(mockResponse)

      const result = await itemsApi.list()

      // TypeScript compilation ensures type safety
      // Runtime validation of response structure
      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page')
      expect(result).toHaveProperty('size')
      expect(result).toHaveProperty('pages')
      expect(Array.isArray(result.items)).toBe(true)
      if (result.items.length > 0) {
        expect(result.items[0]).toHaveProperty('id')
        expect(result.items[0]).toHaveProperty('title')
        expect(result.items[0]).toHaveProperty('description')
        expect(result.items[0]).toHaveProperty('status')
        expect(result.items[0]).toHaveProperty('created_at')
        expect(result.items[0]).toHaveProperty('updated_at')
      }
    })
  })

  describe('GET /items/:id - Get Single', () => {
    it('constructs correct URL with item ID', async () => {
      const mockItem: Item = {
        id: 'item-123',
        title: 'Test Item',
        description: 'Test Description',
        status: 'active',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      }
      fetchApi.mockResolvedValue(mockItem)

      await itemsApi.get('item-123')

      expect(fetchApi).toHaveBeenCalledWith('/items/item-123')
    })

    it('response satisfies Item type', async () => {
      const mockItem: Item = {
        id: 'item-123',
        title: 'Test Item',
        description: 'Test Description',
        status: 'archived',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      }
      fetchApi.mockResolvedValue(mockItem)

      const result = await itemsApi.get('item-123')

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('description')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')
      expect(['active', 'archived']).toContain(result.status)
    })
  })

  describe('POST /items - Create', () => {
    it('sends correct method and endpoint', async () => {
      const mockItem: Item = {
        id: 'new-item',
        title: 'New Item',
        description: 'New Description',
        status: 'active',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      }
      fetchApi.mockResolvedValue(mockItem)

      const createData: ItemCreate = {
        title: 'New Item',
        description: 'New Description',
      }

      await itemsApi.create(createData)

      expect(fetchApi).toHaveBeenCalledWith('/items', {
        method: 'POST',
        body: JSON.stringify(createData),
      })
    })

    it('request body matches ItemCreate type', async () => {
      const mockItem: Item = {
        id: 'new-item',
        title: 'New Item',
        description: 'New Description',
        status: 'active',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      }
      fetchApi.mockResolvedValue(mockItem)

      const createData: ItemCreate = {
        title: 'New Item',
        description: 'New Description',
      }

      await itemsApi.create(createData)

      const callArgs = fetchApi.mock.calls[0]
      const requestBody = JSON.parse(callArgs[1].body as string)

      // ItemCreate only has title and description
      expect(requestBody).toHaveProperty('title')
      expect(requestBody).toHaveProperty('description')
      expect(requestBody).not.toHaveProperty('id')
      expect(requestBody).not.toHaveProperty('status')
      expect(requestBody).not.toHaveProperty('created_at')
      expect(requestBody).not.toHaveProperty('updated_at')
    })
  })

  describe('PATCH /items/:id - Update', () => {
    it('sends correct method and endpoint', async () => {
      const mockItem: Item = {
        id: 'item-123',
        title: 'Updated Item',
        description: 'Updated Description',
        status: 'active',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      }
      fetchApi.mockResolvedValue(mockItem)

      const updateData: ItemUpdate = {
        title: 'Updated Item',
      }

      await itemsApi.update('item-123', updateData)

      expect(fetchApi).toHaveBeenCalledWith('/items/item-123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      })
    })

    it('request body matches ItemUpdate type (partial)', async () => {
      const mockItem: Item = {
        id: 'item-123',
        title: 'Updated Item',
        description: 'Original Description',
        status: 'archived',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      }
      fetchApi.mockResolvedValue(mockItem)

      // ItemUpdate allows partial updates
      const updateData: ItemUpdate = {
        status: 'archived',
      }

      await itemsApi.update('item-123', updateData)

      const callArgs = fetchApi.mock.calls[0]
      const requestBody = JSON.parse(callArgs[1].body as string)

      expect(requestBody).toHaveProperty('status')
      expect(requestBody.status).toBe('archived')
    })

    it('allows updating multiple fields', async () => {
      const mockItem: Item = {
        id: 'item-123',
        title: 'Updated Title',
        description: 'Updated Description',
        status: 'active',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      }
      fetchApi.mockResolvedValue(mockItem)

      const updateData: ItemUpdate = {
        title: 'Updated Title',
        description: 'Updated Description',
        status: 'active',
      }

      await itemsApi.update('item-123', updateData)

      const callArgs = fetchApi.mock.calls[0]
      const requestBody = JSON.parse(callArgs[1].body as string)

      expect(requestBody).toHaveProperty('title')
      expect(requestBody).toHaveProperty('description')
      expect(requestBody).toHaveProperty('status')
    })
  })

  describe('DELETE /items/:id - Delete', () => {
    it('sends correct method and endpoint', async () => {
      fetchApi.mockResolvedValue(undefined)

      await itemsApi.delete('item-123')

      expect(fetchApi).toHaveBeenCalledWith('/items/item-123', { method: 'DELETE' })
    })

    it('handles void return type', async () => {
      fetchApi.mockResolvedValue(undefined)

      const result = await itemsApi.delete('item-123')

      expect(result).toBeUndefined()
    })
  })

  describe('GET /dashboard/stats - Dashboard', () => {
    it('constructs correct endpoint', async () => {
      const mockStats: DashboardStats = {
        total_items: 100,
        active_items: 75,
        archived_items: 25,
      }
      fetchApi.mockResolvedValue(mockStats)

      await itemsApi.dashboardStats()

      expect(fetchApi).toHaveBeenCalledWith('/dashboard/stats')
    })

    it('response satisfies DashboardStats type', async () => {
      const mockStats: DashboardStats = {
        total_items: 100,
        active_items: 75,
        archived_items: 25,
      }
      fetchApi.mockResolvedValue(mockStats)

      const result = await itemsApi.dashboardStats()

      expect(result).toHaveProperty('total_items')
      expect(result).toHaveProperty('active_items')
      expect(result).toHaveProperty('archived_items')
      expect(typeof result.total_items).toBe('number')
      expect(typeof result.active_items).toBe('number')
      expect(typeof result.archived_items).toBe('number')
    })
  })
})
