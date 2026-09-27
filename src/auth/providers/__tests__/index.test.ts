import { renderHook, waitFor } from '@testing-library/react-native'

import type { AuthProviderImplementation, AuthProviderType } from '../../types'
import { createAuthProvider } from '../index'

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('../ory', () => {
  const actual = jest.requireActual('../ory')
  return { ...actual, createOryProvider: jest.fn(actual.createOryProvider) }
})

jest.mock('../mock', () => {
  const actual = jest.requireActual('../mock')
  return { ...actual, createMockProvider: jest.fn(actual.createMockProvider) }
})

const SecureStore = jest.requireMock('expo-secure-store') as { getItemAsync: jest.Mock }
const { createOryProvider, resetOryAuth } = jest.requireMock('../ory') as {
  createOryProvider: jest.Mock
  resetOryAuth: () => void
}
const { createMockProvider } = jest.requireMock('../mock') as { createMockProvider: jest.Mock }

function expectProviderShape(provider: AuthProviderImplementation) {
  expect(provider).toEqual({
    useAuthState: expect.any(Function),
    login: expect.any(Function),
    logout: expect.any(Function),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  resetOryAuth()
  SecureStore.getItemAsync.mockResolvedValue(null)
})

describe('createAuthProvider', () => {
  it.each<[AuthProviderType, jest.Mock, jest.Mock]>([
    ['mock', createMockProvider, createOryProvider],
    ['ory', createOryProvider, createMockProvider],
  ])('returns the %s provider with no status set', async (type, expected, other) => {
    const provider = createAuthProvider(type)

    expectProviderShape(provider)
    expect(expected).toHaveBeenCalledTimes(1)
    expect(other).not.toHaveBeenCalled()

    const { result } = await renderHook(() => provider.useAuthState())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.status).toBeUndefined()
    expect(result.current.error).toBeNull()
  })

  it.each<AuthProviderType>([
    'auth0',
    'keycloak',
    'cognito',
  ])('returns (does not throw) an unconfigured provider for "%s"', (type) => {
    let provider: AuthProviderImplementation | undefined
    expect(() => {
      provider = createAuthProvider(type)
    }).not.toThrow()
    if (!provider) throw new Error('provider was not created')

    expectProviderShape(provider)
    const state = provider.useAuthState()
    expect(state.status).toBe('unconfigured')
    expect(state.error?.message).toContain(type)
    expect(createMockProvider).not.toHaveBeenCalled()
    expect(createOryProvider).not.toHaveBeenCalled()
  })

  it('treats an unknown runtime value as unconfigured rather than falling back to mock', () => {
    const provider = createAuthProvider('firebase' as AuthProviderType)
    const state = provider.useAuthState()

    expect(state.status).toBe('unconfigured')
    expect(state.error?.message).toContain('firebase')
    expect(createMockProvider).not.toHaveBeenCalled()
  })
})
