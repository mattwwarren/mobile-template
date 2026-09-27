import { useSyncExternalStore } from 'react'
import type { AuthUser } from '../types'

export interface ExternalAuthState {
  user: AuthUser | null
  isLoading: boolean
  error: Error | null
}

/**
 * External store for auth state driven by async SDK calls outside React's render cycle.
 * Read it from components through `useStore()` (useSyncExternalStore).
 */
export function createExternalAuthStore(
  initialState: ExternalAuthState = {
    user: null,
    isLoading: true,
    error: null,
  }
) {
  let state = { ...initialState }
  const listeners = new Set<() => void>()

  function emitChange(): void {
    for (const listener of listeners) {
      listener()
    }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function getSnapshot(): ExternalAuthState {
    return state
  }

  function setState(updates: Partial<ExternalAuthState>): void {
    state = { ...state, ...updates }
    emitChange()
  }

  function setUser(user: AuthUser | null): void {
    setState({ user, isLoading: false })
  }

  function setLoading(isLoading: boolean): void {
    setState({ isLoading })
  }

  function setError(error: Error | null): void {
    setState({ error, isLoading: false })
  }

  function reset(): void {
    state = { ...initialState }
    emitChange()
  }

  function useStore(): ExternalAuthState {
    return useSyncExternalStore(subscribe, getSnapshot)
  }

  return {
    subscribe,
    getSnapshot,
    setState,
    setUser,
    setLoading,
    setError,
    reset,
    useStore,
  }
}

export type ExternalAuthStore = ReturnType<typeof createExternalAuthStore>
