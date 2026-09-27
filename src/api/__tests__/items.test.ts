describe('itemsApi mock/real switch', () => {
  it('routes to the real, fetchApi-backed implementation when USE_MOCKS is false', async () => {
    const mockFetchApi = jest
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, size: 10, pages: 0 })
    let request: Promise<unknown> | undefined

    jest.isolateModules(() => {
      jest.mock('@/config', () => ({ USE_MOCKS: false }))
      jest.mock('@/api/client', () => ({ fetchApi: mockFetchApi }))
      const { itemsApi } = require('@/api/items')
      request = itemsApi.list()
    })

    if (!request) throw new Error('Expected itemsApi.list() to return a promise')
    await request
    expect(mockFetchApi).toHaveBeenCalled()
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
  it('parses USE_MOCKS as true when EXPO_PUBLIC_USE_MOCKS is "true"', () => {
    jest.isolateModules(() => {
      jest.unmock('@/config')
      const { parseUseMocks } = require('@/config')
      expect(parseUseMocks('true')).toBe(true)
    })
  })

  it('parses USE_MOCKS as false when EXPO_PUBLIC_USE_MOCKS is "false"', () => {
    jest.isolateModules(() => {
      jest.unmock('@/config')
      const { parseUseMocks } = require('@/config')
      expect(parseUseMocks('false')).toBe(false)
    })
  })
})
