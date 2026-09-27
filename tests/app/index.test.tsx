import { render, screen } from '@testing-library/react-native'

import Index from '../../app/index'

jest.mock('@/auth', () => ({
  useAuth: jest.fn(),
  AUTH_STATUS_UNCONFIGURED: 'unconfigured',
}))
jest.mock('expo-router', () => ({ Redirect: jest.fn(() => null) }))

const { useAuth } = jest.requireMock('@/auth') as { useAuth: jest.Mock }
const { Redirect } = jest.requireMock('expo-router') as { Redirect: jest.Mock }

const BASE_AUTH = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('app/index entry gate', () => {
  it('renders a full-screen error and never redirects when the provider is unconfigured', async () => {
    useAuth.mockReturnValue({
      ...BASE_AUTH,
      status: 'unconfigured',
      error: new Error('EXPO_PUBLIC_AUTH_PROVIDER=auth0 is not implemented in this template'),
    })

    await render(<Index />)

    expect(
      screen.getByText('EXPO_PUBLIC_AUTH_PROVIDER=auth0 is not implemented in this template')
    ).toBeTruthy()
    expect(screen.queryByTestId('auth-loading')).toBeNull()
    expect(Redirect).not.toHaveBeenCalled()
  })

  it('still renders the loading spinner when no status is set', async () => {
    useAuth.mockReturnValue({ ...BASE_AUTH, isLoading: true })

    await render(<Index />)

    expect(screen.getByTestId('auth-loading')).toBeTruthy()
    expect(Redirect).not.toHaveBeenCalled()
  })

  it('does not treat an ordinary error without status as unconfigured', async () => {
    useAuth.mockReturnValue({ ...BASE_AUTH, error: new Error('SecureStore read failed') })

    await render(<Index />)

    expect(screen.queryByText('SecureStore read failed')).toBeNull()
    expect(Redirect.mock.calls[0]?.[0]).toMatchObject({ href: '/(auth)/login' })
  })

  it('redirects authenticated users to the tabs', async () => {
    useAuth.mockReturnValue({
      ...BASE_AUTH,
      isAuthenticated: true,
      user: { id: '1', email: 'dev@example.com' },
    })

    await render(<Index />)

    expect(Redirect.mock.calls[0]?.[0]).toMatchObject({ href: '/(tabs)' })
  })
})
