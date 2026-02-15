import * as SecureStore from 'expo-secure-store'

const AUTH_TOKEN_KEY = 'auth_token'

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4455'

/**
 * Type-safe error response interface.
 * Handles various backend error response formats.
 */
interface ErrorResponse {
  detail?: string | string[]
  message?: string
  code?: string
}

export class ApiError extends Error {
  status: number
  statusText: string

  constructor(status: number, statusText: string, message?: string) {
    super(message ?? `${status} ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
  }
}

/**
 * Get the stored auth token from SecureStore.
 * Returns null if no token is stored.
 */
export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY)
}

/**
 * Store an auth token in SecureStore.
 */
export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token)
}

/**
 * Remove the stored auth token from SecureStore.
 */
export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)
}

/**
 * Handles API response - throws ApiError for non-OK status, returns parsed JSON.
 * Handles 204 No Content responses by returning undefined.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorResponse

    const detail = Array.isArray(body.detail) ? body.detail.join(', ') : body.detail
    throw new ApiError(response.status, response.statusText, detail ?? body.message)
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }

  return response.json() as Promise<T>
}

/**
 * Type-safe fetch wrapper for API calls.
 * Automatically injects Authorization header with Bearer token from SecureStore.
 */
export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const token = await getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  return handleResponse<T>(response)
}
