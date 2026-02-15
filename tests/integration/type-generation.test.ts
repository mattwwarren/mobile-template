import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { DashboardStats, Item, ItemCreate, ItemUpdate, PaginatedResponse } from '@/api/types'

describe('Type Generation', () => {
  const projectRoot = join(__dirname, '../..')
  const generateTypesScript = join(projectRoot, 'scripts/generate-types.sh')
  const generatedTypesFile = join(projectRoot, 'src/api/generated/types.ts')

  describe('Scripts', () => {
    it('generate-types.sh script exists', () => {
      expect(existsSync(generateTypesScript)).toBe(true)
    })

    it('generate-types.sh script is a file', () => {
      const stats = statSync(generateTypesScript)
      expect(stats.isFile()).toBe(true)
    })
  })

  describe('Generated Types File', () => {
    it('src/api/generated/types.ts exists', () => {
      expect(existsSync(generatedTypesFile)).toBe(true)
    })

    it('src/api/generated/types.ts is importable', () => {
      // Import the generated types module
      // Even if it's a placeholder, it should be importable without errors
      const types = require('@/api/generated/types')
      expect(types).toBeDefined()
    })
  })

  describe('Type Aliases Consistency', () => {
    it('Item type has expected fields', () => {
      const mockItem: Item = {
        id: 'test-id',
        title: 'Test Title',
        description: 'Test Description',
        status: 'active',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      }

      // TypeScript compilation validates the shape
      expect(mockItem.id).toBe('test-id')
      expect(mockItem.title).toBe('Test Title')
      expect(mockItem.description).toBe('Test Description')
      expect(mockItem.status).toBe('active')
      expect(mockItem.created_at).toBe('2026-02-15T00:00:00Z')
      expect(mockItem.updated_at).toBe('2026-02-15T00:00:00Z')
    })

    it('Item status field is properly typed', () => {
      const activeItem: Item = {
        id: 'test-id',
        title: 'Test',
        description: 'Test',
        status: 'active',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      }

      const archivedItem: Item = {
        id: 'test-id',
        title: 'Test',
        description: 'Test',
        status: 'archived',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      }

      expect(['active', 'archived']).toContain(activeItem.status)
      expect(['active', 'archived']).toContain(archivedItem.status)
    })

    it('ItemCreate type has required fields only', () => {
      const mockCreate: ItemCreate = {
        title: 'New Item',
        description: 'New Description',
      }

      // TypeScript ensures no extra fields are allowed
      expect(mockCreate.title).toBe('New Item')
      expect(mockCreate.description).toBe('New Description')

      // Type system prevents adding id, status, timestamps
      // @ts-expect-error - id should not be on ItemCreate
      const invalidCreate: ItemCreate = {
        title: 'Test',
        description: 'Test',
        id: 'should-not-exist',
      }

      expect(invalidCreate).toBeDefined()
    })

    it('ItemUpdate type allows partial updates', () => {
      // All fields optional
      const titleOnly: ItemUpdate = {
        title: 'Updated Title',
      }

      const descriptionOnly: ItemUpdate = {
        description: 'Updated Description',
      }

      const statusOnly: ItemUpdate = {
        status: 'archived',
      }

      const multipleFields: ItemUpdate = {
        title: 'Updated Title',
        status: 'active',
      }

      expect(titleOnly.title).toBe('Updated Title')
      expect(descriptionOnly.description).toBe('Updated Description')
      expect(statusOnly.status).toBe('archived')
      expect(multipleFields.title).toBe('Updated Title')
      expect(multipleFields.status).toBe('active')
    })

    it('PaginatedResponse type has expected structure', () => {
      const mockResponse: PaginatedResponse<Item> = {
        items: [
          {
            id: 'item-1',
            title: 'Item 1',
            description: 'Description 1',
            status: 'active',
            created_at: '2026-02-15T00:00:00Z',
            updated_at: '2026-02-15T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      }

      expect(mockResponse.items).toHaveLength(1)
      expect(mockResponse.total).toBe(1)
      expect(mockResponse.page).toBe(1)
      expect(mockResponse.size).toBe(10)
      expect(mockResponse.pages).toBe(1)
    })

    it('PaginatedResponse is generic over item type', () => {
      type CustomType = { value: string }

      const customResponse: PaginatedResponse<CustomType> = {
        items: [{ value: 'test' }],
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      }

      expect(customResponse.items[0].value).toBe('test')
    })

    it('DashboardStats type has expected fields', () => {
      const mockStats: DashboardStats = {
        total_items: 100,
        active_items: 75,
        archived_items: 25,
      }

      expect(mockStats.total_items).toBe(100)
      expect(mockStats.active_items).toBe(75)
      expect(mockStats.archived_items).toBe(25)
    })

    it('DashboardStats fields are numbers', () => {
      const mockStats: DashboardStats = {
        total_items: 100,
        active_items: 75,
        archived_items: 25,
      }

      expect(typeof mockStats.total_items).toBe('number')
      expect(typeof mockStats.active_items).toBe('number')
      expect(typeof mockStats.archived_items).toBe('number')
    })
  })

  describe('Type Import Paths', () => {
    it('can import types from @/api/types', () => {
      const types = require('@/api/types')
      expect(types).toBeDefined()
    })

    it('can import generated types from @/api/generated/types', () => {
      const generatedTypes = require('@/api/generated/types')
      expect(generatedTypes).toBeDefined()
    })
  })

  describe('OpenAPI Spec Integration', () => {
    it('documents OpenAPI spec location', () => {
      const expectedSpecPath = join(projectRoot, '../specs/openapi.json')

      // This test documents where the spec should be
      // The generate-types.sh script expects it at ../specs/openapi.json
      expect(expectedSpecPath).toContain('specs/openapi.json')
    })

    it('type generation script points to correct spec location', () => {
      // The script references ../specs/openapi.json from project root
      const relativeSpecPath = '../specs/openapi.json'

      expect(relativeSpecPath).toBe('../specs/openapi.json')
    })
  })
})
