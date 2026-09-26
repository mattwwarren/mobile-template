import type { FrontendApi, Session } from '@ory/client-fetch'

import { clearAuthToken, getAuthToken, setAuthToken } from '@/api/client'
import type { AuthProviderImplementation, AuthState, AuthUser } from '../types'
import { createExternalAuthStore } from './createExternalStore'

const SDK_MISSING_MESSAGE =
  'Ory SDK (@ory/client-fetch) is not installed. Run: npm install @ory/client-fetch'

const store = createExternalAuthStore()

function getOryConfig(): { sdkUrl: string } {
  const sdkUrl = process.env.EXPO_PUBLIC_ORY_SDK_URL
  if (!sdkUrl) {
    throw new Error(
      'EXPO_PUBLIC_ORY_SDK_URL environment variable is required for Ory authentication'
    )
  }
  return { sdkUrl }
}

function createOryClient(): FrontendApi | null {
  let sdk: typeof import('@ory/client-fetch')
  try {
    // Metro treats a require() placed directly in a try block as optional, so a missing SDK
    // throws here instead of failing the bundle. import() is avoided: Jest cannot execute it.
    sdk = require('@ory/client-fetch')
  } catch (err) {
    console.error(SDK_MISSING_MESSAGE, err)
    return null
  }
  const { sdkUrl } = getOryConfig()
  return new sdk.FrontendApi(new sdk.Configuration({ basePath: sdkUrl }))
}

function requireOryClient(): FrontendApi {
  const client = createOryClient()
  if (!client) {
    throw new Error(SDK_MISSING_MESSAGE)
  }
  return client
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function responseStatus(err: unknown): number | null {
  if (isRecord(err) && isRecord(err.response) && typeof err.response.status === 'number') {
    return err.response.status
  }
  return null
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err))
}

function toAuthUser(session: Session): AuthUser {
  const identity = session.identity
  if (!identity) {
    throw new Error('Ory session has no identity')
  }
  const traits = isRecord(identity.traits) ? identity.traits : {}
  const email = typeof traits.email === 'string' ? traits.email : ''
  const nameTraits = isRecord(traits.name) ? traits.name : {}
  const name = [nameTraits.first, nameTraits.last]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ')

  return name ? { id: identity.id, email, name } : { id: identity.id, email }
}

async function checkSession(): Promise<void> {
  store.setState({ isLoading: true, error: null })

  try {
    const token = await getAuthToken()
    if (!token) {
      store.setUser(null)
      return
    }
    const client = requireOryClient()
    const session = await client.toSession({ xSessionToken: token })
    store.setUser(toAuthUser(session))
  } catch (err) {
    store.setUser(null)
    if (responseStatus(err) === 401) {
      await clearAuthToken().catch((clearErr: unknown) => {
        console.error('Failed to clear expired Ory session token', clearErr)
      })
      return
    }
    store.setError(toError(err))
  }
}

async function login(credentials?: { email?: string; password?: string }): Promise<void> {
  const identifier = credentials?.email
  const password = credentials?.password
  if (!identifier || !password) {
    throw new Error('Email and password are required')
  }

  try {
    const client = requireOryClient()
    const flow = await client.createNativeLoginFlow()
    const result = await client.updateLoginFlow({
      flow: flow.id,
      updateLoginFlowBody: { method: 'password', identifier, password },
    })
    if (!result.session_token) {
      throw new Error('Ory login did not return a session token')
    }
    const user = toAuthUser(result.session)
    await setAuthToken(result.session_token)
    store.setState({ error: null })
    store.setUser(user)
  } catch (err) {
    const error =
      responseStatus(err) === 400 ? new Error('Invalid email or password') : toError(err)
    store.setError(error)
    throw error
  }
}

async function logout(): Promise<void> {
  try {
    const token = await getAuthToken()
    const client = token ? createOryClient() : null
    if (token && client) {
      await client.performNativeLogout({ performNativeLogoutBody: { session_token: token } })
    }
  } catch (err) {
    console.error('Ory logout failed; clearing local session anyway', err)
  }

  try {
    await clearAuthToken()
  } finally {
    store.setUser(null)
  }
}

let initialized = false
function ensureInitialized(): void {
  if (!initialized) {
    initialized = true
    void checkSession()
  }
}

/**
 * Ory provider using Kratos native (API) flows: credentials are exchanged for a
 * session token held in expo-secure-store and sent as `X-Session-Token`; no cookies
 * or browser redirects.
 */
export function createOryProvider(): AuthProviderImplementation {
  ensureInitialized()

  const useAuthState = (): AuthState => {
    const state = store.useStore()
    return {
      user: state.user,
      isAuthenticated: state.user !== null,
      isLoading: state.isLoading,
      error: state.error,
    }
  }

  return { useAuthState, login, logout }
}

export function resetOryAuth(): void {
  store.reset()
  initialized = false
}
