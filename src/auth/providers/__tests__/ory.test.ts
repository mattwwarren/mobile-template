import type { AuthProviderImplementation } from '../../types'

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

// Fixture shapes follow @ory/client-fetch v1.22 typings (Session, SuccessfulNativeLogin,
// ResponseError); keep them sparse since optional SDK fields are routinely absent.
const mockOry = {
  installed: true,
  configurations: [] as unknown[],
  toSession: jest.fn(),
  createNativeLoginFlow: jest.fn(),
  updateLoginFlow: jest.fn(),
  performNativeLogout: jest.fn(),
}

jest.mock('@ory/client-fetch', () => {
  if (!mockOry.installed) {
    throw new Error("Cannot find module '@ory/client-fetch'")
  }
  return {
    Configuration: jest.fn((params: unknown) => {
      mockOry.configurations.push(params)
      return { params }
    }),
    FrontendApi: jest.fn(() => ({
      toSession: mockOry.toSession,
      createNativeLoginFlow: mockOry.createNativeLoginFlow,
      updateLoginFlow: mockOry.updateLoginFlow,
      performNativeLogout: mockOry.performNativeLogout,
    })),
  }
})

type OryModule = typeof import('../ory')
// Fresh per test: jest.resetModules() below would otherwise pair a stale renderer with a new React.
type Rntl = typeof import('@testing-library/react-native/pure')

const SDK_URL = 'https://ory.example.test'
const STORED_TOKEN = 'ory_st_stored'
const AUTH_TOKEN_KEY = 'auth_token'

const SESSION = {
  id: 'session-1',
  identity: {
    id: 'identity-1',
    schema_id: 'preset://email',
    schema_url: `${SDK_URL}/schemas/cHJlc2V0Oi8vZW1haWw`,
    traits: { email: 'ada@example.com', name: { first: 'Ada', last: 'Lovelace' } },
  },
}

function responseError(status: number): Error {
  return Object.assign(new Error('Response returned an error code'), {
    name: 'ResponseError',
    response: { status },
  })
}

let ory: OryModule
let act: Rntl['act']
let renderHook: Rntl['renderHook']
let waitFor: Rntl['waitFor']
let cleanup: Rntl['cleanup']
let SecureStore: { getItemAsync: jest.Mock; setItemAsync: jest.Mock; deleteItemAsync: jest.Mock }
let consoleError: jest.SpyInstance

beforeEach(() => {
  jest.resetModules()
  mockOry.installed = true
  mockOry.configurations = []
  mockOry.toSession.mockReset()
  mockOry.createNativeLoginFlow.mockReset()
  mockOry.updateLoginFlow.mockReset()
  mockOry.performNativeLogout.mockReset()
  process.env.EXPO_PUBLIC_ORY_SDK_URL = SDK_URL

  SecureStore = jest.requireMock('expo-secure-store')
  SecureStore.getItemAsync.mockResolvedValue(null)
  SecureStore.setItemAsync.mockResolvedValue(undefined)
  SecureStore.deleteItemAsync.mockResolvedValue(undefined)

  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  ;({ act, renderHook, waitFor, cleanup } = require('@testing-library/react-native/pure') as Rntl)
  ory = require('../ory') as OryModule
})

afterEach(async () => {
  await cleanup()
  consoleError.mockRestore()
  delete process.env.EXPO_PUBLIC_ORY_SDK_URL
})

async function mountProvider(): Promise<{
  provider: AuthProviderImplementation
  result: { current: ReturnType<AuthProviderImplementation['useAuthState']> }
}> {
  const provider = ory.createOryProvider()
  const { result } = await renderHook(() => provider.useAuthState())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  return { provider, result }
}

describe('Ory provider — session hydration on mount', () => {
  it('stays signed out without calling Ory when no session token is stored', async () => {
    const { result } = await mountProvider()

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.status).toBeUndefined()
    expect(mockOry.toSession).not.toHaveBeenCalled()
  })

  it('hydrates the user from a stored session token', async () => {
    SecureStore.getItemAsync.mockResolvedValue(STORED_TOKEN)
    mockOry.toSession.mockResolvedValue(SESSION)

    const { result } = await mountProvider()

    expect(mockOry.configurations).toEqual([{ basePath: SDK_URL }])
    expect(mockOry.toSession).toHaveBeenCalledWith({ xSessionToken: STORED_TOKEN })
    expect(result.current.user).toEqual({
      id: 'identity-1',
      email: 'ada@example.com',
      name: 'Ada Lovelace',
    })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('omits name when identity traits carry only an email', async () => {
    SecureStore.getItemAsync.mockResolvedValue(STORED_TOKEN)
    mockOry.toSession.mockResolvedValue({
      ...SESSION,
      identity: { ...SESSION.identity, traits: { email: 'ada@example.com' } },
    })

    const { result } = await mountProvider()

    expect(result.current.user).toEqual({ id: 'identity-1', email: 'ada@example.com' })
  })

  it('treats a 401 as signed out, clears the stale token, and surfaces no error', async () => {
    SecureStore.getItemAsync.mockResolvedValue(STORED_TOKEN)
    mockOry.toSession.mockRejectedValue(responseError(401))

    const { result } = await mountProvider()

    expect(result.current.user).toBeNull()
    expect(result.current.error).toBeNull()
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY)
  })

  it('surfaces non-401 failures as an Error', async () => {
    SecureStore.getItemAsync.mockResolvedValue(STORED_TOKEN)
    mockOry.toSession.mockRejectedValue(responseError(500))

    const { result } = await mountProvider()

    expect(result.current.user).toBeNull()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled()
  })

  it('converts non-Error rejections into Error instances', async () => {
    SecureStore.getItemAsync.mockResolvedValue(STORED_TOKEN)
    mockOry.toSession.mockRejectedValue('network down')

    const { result } = await mountProvider()

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('network down')
  })

  it('reports a missing SDK as an error instead of crashing', async () => {
    mockOry.installed = false
    SecureStore.getItemAsync.mockResolvedValue(STORED_TOKEN)

    const { result } = await mountProvider()

    expect(result.current.user).toBeNull()
    expect(result.current.error?.message).toContain('@ory/client-fetch')
    expect(consoleError).toHaveBeenCalled()
  })

  it('reports a missing EXPO_PUBLIC_ORY_SDK_URL as an error instead of crashing', async () => {
    delete process.env.EXPO_PUBLIC_ORY_SDK_URL
    SecureStore.getItemAsync.mockResolvedValue(STORED_TOKEN)

    const { result } = await mountProvider()

    expect(result.current.error?.message).toContain('EXPO_PUBLIC_ORY_SDK_URL')
    expect(mockOry.toSession).not.toHaveBeenCalled()
  })

  it('only runs the session check once across multiple provider instances', async () => {
    SecureStore.getItemAsync.mockResolvedValue(STORED_TOKEN)
    mockOry.toSession.mockResolvedValue(SESSION)

    await mountProvider()
    ory.createOryProvider()

    expect(mockOry.toSession).toHaveBeenCalledTimes(1)
  })

  it('resetOryAuth clears state and allows the session check to run again', async () => {
    SecureStore.getItemAsync.mockResolvedValue(STORED_TOKEN)
    mockOry.toSession.mockResolvedValue(SESSION)
    await mountProvider()

    ory.resetOryAuth()
    const { result } = await mountProvider()

    expect(mockOry.toSession).toHaveBeenCalledTimes(2)
    expect(result.current.user?.id).toBe('identity-1')
  })
})

describe('Ory provider — login', () => {
  const CREDENTIALS = { email: 'ada@example.com', password: 'correct horse' }

  it('runs the native password flow and stores the returned session token', async () => {
    mockOry.createNativeLoginFlow.mockResolvedValue({ id: 'flow-1' })
    mockOry.updateLoginFlow.mockResolvedValue({
      session: SESSION,
      session_token: 'ory_st_new',
    })
    const { provider, result } = await mountProvider()

    await act(async () => {
      await provider.login(CREDENTIALS)
    })

    expect(mockOry.createNativeLoginFlow).toHaveBeenCalledTimes(1)
    expect(mockOry.updateLoginFlow).toHaveBeenCalledWith({
      flow: 'flow-1',
      updateLoginFlowBody: {
        method: 'password',
        identifier: 'ada@example.com',
        password: 'correct horse',
      },
    })
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY, 'ory_st_new')
    expect(result.current.user?.email).toBe('ada@example.com')
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it.each([
    undefined,
    { email: 'ada@example.com' },
    { password: 'pw' },
  ])('rejects without calling Ory when credentials are incomplete (%p)', async (credentials) => {
    const { provider } = await mountProvider()

    await expect(provider.login(credentials)).rejects.toThrow('Email and password are required')
    expect(mockOry.createNativeLoginFlow).not.toHaveBeenCalled()
  })

  it('rejects with a readable message and records the error when Ory refuses the credentials', async () => {
    mockOry.createNativeLoginFlow.mockResolvedValue({ id: 'flow-1' })
    mockOry.updateLoginFlow.mockRejectedValue(responseError(400))
    const { provider, result } = await mountProvider()

    let caught: unknown
    await act(async () => {
      caught = await provider.login(CREDENTIALS).catch((e: unknown) => e)
    })

    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).message).toBe('Invalid email or password')
    expect(result.current.error).toBe(caught)
    expect(result.current.isAuthenticated).toBe(false)
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled()
  })

  it('rejects when Ory returns no session token', async () => {
    mockOry.createNativeLoginFlow.mockResolvedValue({ id: 'flow-1' })
    mockOry.updateLoginFlow.mockResolvedValue({ session: SESSION })
    const { provider } = await mountProvider()

    await act(async () => {
      await expect(provider.login(CREDENTIALS)).rejects.toThrow('session token')
    })
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled()
  })

  it('rejects when the SDK is not installed', async () => {
    mockOry.installed = false
    const { provider } = await mountProvider()

    await act(async () => {
      await expect(provider.login(CREDENTIALS)).rejects.toThrow('@ory/client-fetch')
    })
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled()
  })
})

describe('Ory provider — logout', () => {
  it('revokes the native session, clears the token, and signs the user out', async () => {
    SecureStore.getItemAsync.mockResolvedValue(STORED_TOKEN)
    mockOry.toSession.mockResolvedValue(SESSION)
    mockOry.performNativeLogout.mockResolvedValue(undefined)
    const { provider, result } = await mountProvider()
    expect(result.current.isAuthenticated).toBe(true)

    await act(async () => {
      await provider.logout()
    })

    expect(mockOry.performNativeLogout).toHaveBeenCalledWith({
      performNativeLogoutBody: { session_token: STORED_TOKEN },
    })
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY)
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('still clears local state when the Ory logout call fails', async () => {
    SecureStore.getItemAsync.mockResolvedValue(STORED_TOKEN)
    mockOry.toSession.mockResolvedValue(SESSION)
    mockOry.performNativeLogout.mockRejectedValue(responseError(500))
    const { provider, result } = await mountProvider()

    await act(async () => {
      await provider.logout()
    })

    expect(consoleError).toHaveBeenCalled()
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY)
    expect(result.current.user).toBeNull()
  })

  it('still clears local state when the SDK is not installed', async () => {
    mockOry.installed = false
    SecureStore.getItemAsync.mockResolvedValue(STORED_TOKEN)
    const { provider, result } = await mountProvider()

    await act(async () => {
      await provider.logout()
    })

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY)
    expect(result.current.user).toBeNull()
  })
})
