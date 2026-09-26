export interface AuthUser {
  id: string
  email: string
  name?: string
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: Error | null
  status?: 'unconfigured'
}

export type AuthProviderType = 'mock' | 'ory' | 'auth0' | 'keycloak' | 'cognito'

export interface AuthProviderImplementation {
  useAuthState: () => AuthState
  login: (credentials?: { email?: string; password?: string }) => Promise<void>
  logout: () => Promise<void>
}
