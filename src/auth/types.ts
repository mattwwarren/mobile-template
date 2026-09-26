export interface AuthUser {
  id: string
  email: string
  name?: string
}

export const AUTH_STATUS_UNCONFIGURED = 'unconfigured' as const
export type AuthStatus = typeof AUTH_STATUS_UNCONFIGURED

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: Error | null
  status?: AuthStatus
}

export type AuthProviderType = 'mock' | 'ory' | 'auth0' | 'keycloak' | 'cognito'

export interface AuthProviderImplementation {
  useAuthState: () => AuthState
  login: (credentials?: { email?: string; password?: string }) => Promise<void>
  logout: () => Promise<void>
}
