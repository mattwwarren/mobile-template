import { ApiError, fetchApi } from '@/api/client'

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

// Get mocked module
const SecureStore = jest.requireMock('expo-secure-store') as {
  getItemAsync: jest.Mock
  setItemAsync: jest.Mock
  deleteItemAsync: jest.Mock
}

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  jest.clearAllMocks()
  SecureStore.getItemAsync.mockResolvedValue(null)
})

describe('fetchApi', () => {
  it('makes a successful GET request and returns JSON', async () => {
    const data = { id: '1', name: 'Test' }
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    })

    const result = await fetchApi('/test')
    expect(result).toEqual(data)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('throws ApiError on non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ detail: 'Resource not found' }),
    })

    await expect(fetchApi('/missing')).rejects.toThrow(ApiError)
    await expect(fetchApi('/missing')).rejects.toThrow('Resource not found')
  })

  it('handles 204 No Content by returning undefined', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.reject(new Error('No content')),
    })

    const result = await fetchApi('/items/1')
    expect(result).toBeUndefined()
  })

  it('injects Authorization header when token is stored', async () => {
    SecureStore.getItemAsync.mockResolvedValue('test-token-123')
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })

    await fetchApi('/protected')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      })
    )
  })

  it('does not include Authorization header when no token', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null)
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })

    await fetchApi('/public')
    const callHeaders = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(callHeaders.Authorization).toBeUndefined()
  })

  it('handles error response with array detail', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: () => Promise.resolve({ detail: ['field required', 'value too short'] }),
    })

    await expect(fetchApi('/validate')).rejects.toThrow('field required, value too short')
  })

  it('handles error response with unparseable JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('Invalid JSON')),
    })

    await expect(fetchApi('/broken')).rejects.toThrow('500 Internal Server Error')
  })
})
