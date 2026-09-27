describe('itemsApi mock/real switch', () => {
  it('routes to the real, fetchApi-backed implementation when USE_MOCKS is false', () => {
    jest.isolateModules(() => {
      jest.mock('@/config', () => ({ USE_MOCKS: false }))
      const mockFetchApi = jest
        .fn()
        .mockResolvedValue({ items: [], total: 0, page: 1, size: 10, pages: 0 })
      jest.mock('@/api/client', () => ({ fetchApi: mockFetchApi }))
      const { itemsApi } = require('@/api/items')
      return itemsApi.list().then(() => {
        expect(mockFetchApi).toHaveBeenCalled()
      })
    })
  })

  it('routes list() to the mock implementation when USE_MOCKS is true', () => {
    jest.isolateModules(() => {
      jest.mock('@/config', () => ({ USE_MOCKS: true }))
      const { itemsApi } = require('@/api/items')
      const { mockItemsApi } = require('@/mocks/mock-api')
      expect(itemsApi).toBe(mockItemsApi)
    })
  })

  it('routes get() to the mock implementation when USE_MOCKS is true', () => {
    jest.isolateModules(() => {
      jest.mock('@/config', () => ({ USE_MOCKS: true }))
      const { itemsApi } = require('@/api/items')
      const { mockItemsApi } = require('@/mocks/mock-api')
      expect(itemsApi.get).toBe(mockItemsApi.get)
    })
  })

  it('routes create() to the mock implementation when USE_MOCKS is true', () => {
    jest.isolateModules(() => {
      jest.mock('@/config', () => ({ USE_MOCKS: true }))
      const { itemsApi } = require('@/api/items')
      const { mockItemsApi } = require('@/mocks/mock-api')
      expect(itemsApi.create).toBe(mockItemsApi.create)
    })
  })

  it('routes update() to the mock implementation when USE_MOCKS is true', () => {
    jest.isolateModules(() => {
      jest.mock('@/config', () => ({ USE_MOCKS: true }))
      const { itemsApi } = require('@/api/items')
      const { mockItemsApi } = require('@/mocks/mock-api')
      expect(itemsApi.update).toBe(mockItemsApi.update)
    })
  })

  it('routes delete() to the mock implementation when USE_MOCKS is true', () => {
    jest.isolateModules(() => {
      jest.mock('@/config', () => ({ USE_MOCKS: true }))
      const { itemsApi } = require('@/api/items')
      const { mockItemsApi } = require('@/mocks/mock-api')
      expect(itemsApi.delete).toBe(mockItemsApi.delete)
    })
  })
})

describe('config', () => {
  const original = process.env.EXPO_PUBLIC_USE_MOCKS

  afterEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = original
  })

  it('sets USE_MOCKS to true when EXPO_PUBLIC_USE_MOCKS is "true"', () => {
    jest.isolateModules(() => {
      jest.unmock('@/config')
      process.env.EXPO_PUBLIC_USE_MOCKS = 'true'
      const { USE_MOCKS } = require('@/config')
      expect(USE_MOCKS).toBe(true)
    })
  })

  it('sets USE_MOCKS to false when EXPO_PUBLIC_USE_MOCKS is "false"', () => {
    jest.isolateModules(() => {
      jest.unmock('@/config')
      process.env.EXPO_PUBLIC_USE_MOCKS = 'false'
      const { USE_MOCKS } = require('@/config')
      expect(USE_MOCKS).toBe(false)
    })
  })
})
