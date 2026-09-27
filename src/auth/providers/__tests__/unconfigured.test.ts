import type { AuthProviderType } from '../../types'
import { createUnconfiguredProvider } from '../unconfigured'

const UNIMPLEMENTED: AuthProviderType[] = ['auth0', 'keycloak', 'cognito']

describe('createUnconfiguredProvider', () => {
  it.each(UNIMPLEMENTED)('reports %s as unconfigured', (type) => {
    const provider = createUnconfiguredProvider(type)
    const state = provider.useAuthState()

    expect(state.status).toBe('unconfigured')
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
    expect(state.user).toBeNull()
    expect(state.error).toBeInstanceOf(Error)
    expect(state.error?.message).toContain(`EXPO_PUBLIC_AUTH_PROVIDER=${type}`)
    expect(state.error?.message).toContain('not implemented')
  })

  it('returns a stable state object across calls', () => {
    const provider = createUnconfiguredProvider('auth0')
    expect(provider.useAuthState()).toBe(provider.useAuthState())
  })

  it.each(UNIMPLEMENTED)('rejects login and logout for %s', async (type) => {
    const provider = createUnconfiguredProvider(type)

    await expect(provider.login({ email: 'a@b.c', password: 'pw' })).rejects.toThrow(type)
    await expect(provider.logout()).rejects.toThrow(type)
  })
})
