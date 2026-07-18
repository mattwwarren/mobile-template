import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { itemsApi } from '@/api/items'
import { createItem, createPaginatedItems } from '@/mocks/factories/items'
import { useCreateItem, useItems } from '../useItems'

// Mock the items API module
jest.mock('@/api/items', () => ({
  itemsApi: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    dashboardStats: jest.fn(),
  },
}))

const mockedItemsApi = itemsApi as jest.Mocked<typeof itemsApi>

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

function createWrapper() {
  const queryClient = createTestQueryClient()
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useItems', () => {
  it('returns paginated items from the API', async () => {
    const mockData = createPaginatedItems(1, 10, 25)
    mockedItemsApi.list.mockResolvedValue(mockData)

    const { wrapper } = createWrapper()
    const { result } = await renderHook(() => useItems({ page: 1, size: 10 }), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData)
    expect(mockedItemsApi.list).toHaveBeenCalledWith({ page: 1, size: 10 })
  })

  it('starts in loading state', async () => {
    mockedItemsApi.list.mockReturnValue(new Promise(() => {}))

    const { wrapper } = createWrapper()
    const { result } = await renderHook(() => useItems(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })
})

describe('useCreateItem', () => {
  it('calls itemsApi.create and invalidates list queries', async () => {
    const newItem = createItem({ title: 'New Item' })
    mockedItemsApi.create.mockResolvedValue(newItem)

    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = await renderHook(() => useCreateItem(), { wrapper })

    result.current.mutate({ title: 'New Item', description: 'A test item' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedItemsApi.create).toHaveBeenCalledWith({
      title: 'New Item',
      description: 'A test item',
    })
    expect(invalidateSpy).toHaveBeenCalled()
  })
})
