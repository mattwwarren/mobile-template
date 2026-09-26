import { createContext, useEffect, useMemo, useState } from 'react'
import { createAuthProvider } from './providers'
import type { AuthProviderImplementation, AuthProviderType, AuthUser } from './types'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: Error | null
  status?: 'unconfigured'
  login: (credentials?: { email?: string; password?: string }) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function AuthProviderInner({
  provider,
  children,
}: {
  provider: AuthProviderImplementation
  children: React.ReactNode
}) {
  const authState = provider.useAuthState()

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      login: provider.login,
      logout: provider.logout,
    }),
    [authState, provider.login, provider.logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<AuthProviderImplementation | null>(null)

  useEffect(() => {
    const type = (process.env.EXPO_PUBLIC_AUTH_PROVIDER ?? 'mock') as AuthProviderType
    setProvider(createAuthProvider(type))
  }, [])

  if (!provider) {
    return null
  }

  return <AuthProviderInner provider={provider}>{children}</AuthProviderInner>
}
