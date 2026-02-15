import type { AuthProviderImplementation, AuthProviderType } from '../types'
import { createMockProvider } from './mock'

export function createAuthProvider(type: AuthProviderType): AuthProviderImplementation {
  switch (type) {
    case 'mock':
      return createMockProvider()
    // Future providers: ory, auth0, keycloak, cognito
    default:
      return createMockProvider()
  }
}
