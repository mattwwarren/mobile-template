import type { AuthProviderImplementation, AuthProviderType } from '../types'
import { createMockProvider } from './mock'
import { createOryProvider } from './ory'
import { createUnconfiguredProvider } from './unconfigured'

export function createAuthProvider(type: AuthProviderType): AuthProviderImplementation {
  switch (type) {
    case 'mock':
      return createMockProvider()
    case 'ory':
      return createOryProvider()
    case 'auth0':
    case 'keycloak':
    case 'cognito':
      return createUnconfiguredProvider(type)
    default: {
      const exhaustiveCheck: never = type
      return createUnconfiguredProvider(exhaustiveCheck)
    }
  }
}
