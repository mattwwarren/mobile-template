import * as SecureStore from 'expo-secure-store'
import { useEffect, useState } from 'react'

import { clearAuthToken, setAuthToken } from '@/api/client'
import type { AuthProviderImplementation, AuthState, AuthUser } from '../types'

const MOCK_USER_KEY = 'mock_auth_user'
const MOCK_TOKEN = 'mock-dev-token'

const DEFAULT_USER: AuthUser = {
  id: '1',
  email: 'dev@example.com',
  name: 'Dev User',
}

export function createMockProvider(): AuthProviderImplementation {
  const useAuthState = (): AuthState => {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
      const loadUser = async () => {
        try {
          const stored = await SecureStore.getItemAsync(MOCK_USER_KEY)
          if (stored) {
            setUser(JSON.parse(stored) as AuthUser)
          }
        } catch (e) {
          setError(e instanceof Error ? e : new Error('Failed to load auth state'))
        } finally {
          setIsLoading(false)
        }
      }
      void loadUser()
    }, [])

    return {
      user,
      isAuthenticated: user !== null,
      isLoading,
      error,
    }
  }

  const login = async (credentials?: { email?: string; password?: string }) => {
    const user: AuthUser = {
      ...DEFAULT_USER,
      email: credentials?.email ?? DEFAULT_USER.email,
    }
    await SecureStore.setItemAsync(MOCK_USER_KEY, JSON.stringify(user))
    await setAuthToken(MOCK_TOKEN)
  }

  const logout = async () => {
    await SecureStore.deleteItemAsync(MOCK_USER_KEY)
    await clearAuthToken()
  }

  return { useAuthState, login, logout }
}
