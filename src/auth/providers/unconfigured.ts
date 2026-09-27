import type { AuthProviderImplementation, AuthProviderType, AuthState } from '../types'
import { AUTH_STATUS_UNCONFIGURED } from '../types'

/**
 * Placeholder for provider choices this template declares but does not implement.
 * Reports `status: 'unconfigured'` so the `app/index.tsx` entry gate renders a
 * full-screen error instead of silently falling back to mock auth.
 */
export function createUnconfiguredProvider(type: AuthProviderType): AuthProviderImplementation {
  const error = new Error(`EXPO_PUBLIC_AUTH_PROVIDER=${type} is not implemented in this template`)
  const state: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error,
    status: AUTH_STATUS_UNCONFIGURED,
  }

  return {
    useAuthState: () => state,
    login: async () => {
      throw error
    },
    logout: async () => {
      throw error
    },
  }
}
