import { act, renderHook } from '@testing-library/react-native'

import type { AuthUser } from '../../types'
import { createExternalAuthStore } from '../createExternalStore'

const USER: AuthUser = { id: 'u1', email: 'user@example.com', name: 'Test User' }

describe('createExternalAuthStore', () => {
  it('starts loading with no user or error by default', () => {
    const store = createExternalAuthStore()
    expect(store.getSnapshot()).toEqual({ user: null, isLoading: true, error: null })
  })

  it('setUser stores the user, clears loading, and notifies subscribers', () => {
    const store = createExternalAuthStore()
    const listener = jest.fn()
    store.subscribe(listener)

    store.setUser(USER)

    expect(store.getSnapshot()).toEqual({ user: USER, isLoading: false, error: null })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('setLoading updates only the loading flag', () => {
    const store = createExternalAuthStore({ user: USER, isLoading: false, error: null })
    const listener = jest.fn()
    store.subscribe(listener)

    store.setLoading(true)

    expect(store.getSnapshot()).toEqual({ user: USER, isLoading: true, error: null })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('setError stores an Error instance and clears loading', () => {
    const store = createExternalAuthStore()
    const error = new Error('boom')

    store.setError(error)

    const snapshot = store.getSnapshot()
    expect(snapshot.error).toBe(error)
    expect(snapshot.error).toBeInstanceOf(Error)
    expect(snapshot.isLoading).toBe(false)

    store.setError(null)
    expect(store.getSnapshot().error).toBeNull()
  })

  it('unsubscribe stops notifications', () => {
    const store = createExternalAuthStore()
    const listener = jest.fn()
    const unsubscribe = store.subscribe(listener)

    unsubscribe()
    store.setUser(USER)

    expect(listener).not.toHaveBeenCalled()
  })

  it('reset restores the initial state and notifies subscribers', () => {
    const store = createExternalAuthStore()
    store.setUser(USER)
    store.setError(new Error('boom'))
    const listener = jest.fn()
    store.subscribe(listener)

    store.reset()

    expect(store.getSnapshot()).toEqual({ user: null, isLoading: true, error: null })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('useStore reflects store mutations reactively', async () => {
    const store = createExternalAuthStore()
    const { result } = await renderHook(() => store.useStore())

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      store.setUser(USER)
    })
    expect(result.current.user).toEqual(USER)
    expect(result.current.isLoading).toBe(false)

    const error = new Error('session check failed')
    await act(async () => {
      store.setError(error)
    })
    expect(result.current.error).toBe(error)
  })
})
