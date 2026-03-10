import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { AppState, Text } from 'react-native'
import { SocketProvider } from '../SocketContext'
import { useSocket } from '../useSocket'
import { useTaskEvents } from '../useTaskEvents'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock socket instance with typed event handler storage
type EventHandler = (...args: unknown[]) => void
const listeners = new Map<string, Set<EventHandler>>()

const mockSocket = {
  on: jest.fn((event: string, handler: EventHandler) => {
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event)?.add(handler)
    return mockSocket
  }),
  off: jest.fn((event: string, handler: EventHandler) => {
    listeners.get(event)?.delete(handler)
    return mockSocket
  }),
  disconnect: jest.fn(),
  connect: jest.fn(),
  connected: false,
  id: 'test-socket-id',
}

function emitMock(event: string, ...args: unknown[]) {
  for (const handler of listeners.get(event) ?? []) {
    handler(...args)
  }
}

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('mock-token'),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

const mockUseAuth = jest.fn(() => ({
  user: { id: '1', email: 'test@test.com' },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
}))

jest.mock('@/auth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Spy on AppState.addEventListener instead of mocking the entire react-native module
const mockRemove = jest.fn()
const mockAddEventListener = jest
  .spyOn(AppState, 'addEventListener')
  .mockReturnValue({ remove: mockRemove } as unknown as ReturnType<
    typeof AppState.addEventListener
  >)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
}

function createWrapper() {
  const queryClient = createTestQueryClient()
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <SocketProvider>{children}</SocketProvider>
      </QueryClientProvider>
    ),
  }
}

function createQueryOnlyWrapper() {
  const queryClient = createTestQueryClient()
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  listeners.clear()
  mockSocket.connected = false

  // Reset to authenticated state
  mockUseAuth.mockReturnValue({
    user: { id: '1', email: 'test@test.com' },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
  })
})

// ---------------------------------------------------------------------------
// SocketProvider tests
// ---------------------------------------------------------------------------

describe('SocketProvider', () => {
  it('renders children', () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <Text testID="child">Hello</Text>
        </SocketProvider>
      </QueryClientProvider>
    )

    expect(screen.getByTestId('child')).toBeTruthy()
  })

  it('connects via socket.io when authenticated', async () => {
    const { io } = jest.requireMock('socket.io-client') as { io: jest.Mock }
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <Text>test</Text>
        </SocketProvider>
      </QueryClientProvider>
    )

    // io is called asynchronously after SecureStore.getItemAsync resolves
    await waitFor(() => {
      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: { token: 'mock-token' },
          transports: ['websocket'],
        })
      )
    })
  })

  it('does not connect when not authenticated', async () => {
    const { io } = jest.requireMock('socket.io-client') as { io: jest.Mock }
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    })

    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <Text>test</Text>
        </SocketProvider>
      </QueryClientProvider>
    )

    // Give the async effect a chance to run
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20))
    })

    expect(io).not.toHaveBeenCalled()
  })

  it('subscribes to AppState changes when authenticated', async () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <Text>test</Text>
        </SocketProvider>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })

  it('disconnects socket on unmount', async () => {
    const queryClient = createTestQueryClient()
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <Text>test</Text>
        </SocketProvider>
      </QueryClientProvider>
    )

    // Wait for async connect to complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20))
    })

    unmount()

    expect(mockSocket.disconnect).toHaveBeenCalled()
  })

  it('removes AppState subscription on unmount', async () => {
    const queryClient = createTestQueryClient()
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <Text>test</Text>
        </SocketProvider>
      </QueryClientProvider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20))
    })

    unmount()

    expect(mockRemove).toHaveBeenCalled()
  })

  it('disconnects socket when AppState goes to background', async () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <Text>test</Text>
        </SocketProvider>
      </QueryClientProvider>
    )

    // Wait for socket to be created
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20))
    })

    // Get the AppState change handler
    const appStateHandler = mockAddEventListener.mock.calls[0]?.[1] as
      | ((state: string) => void)
      | undefined
    expect(appStateHandler).toBeDefined()

    act(() => {
      appStateHandler?.('background')
    })

    expect(mockSocket.disconnect).toHaveBeenCalled()
  })

  it('reconnects socket when AppState returns to active', async () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <Text>test</Text>
        </SocketProvider>
      </QueryClientProvider>
    )

    // Wait for socket to be created
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20))
    })

    const appStateHandler = mockAddEventListener.mock.calls[0]?.[1] as
      | ((state: string) => void)
      | undefined
    expect(appStateHandler).toBeDefined()

    // Socket is not connected
    mockSocket.connected = false
    act(() => {
      appStateHandler?.('active')
    })

    expect(mockSocket.connect).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// useSocket tests
// ---------------------------------------------------------------------------

describe('useSocket', () => {
  it('returns null when rendered outside SocketProvider', () => {
    // SocketContext defaults to null
    const { result } = renderHook(() => useSocket())
    expect(result.current).toBeNull()
  })

  it('returns the socket from SocketProvider', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useSocket(), { wrapper })

    // After async connect, socket should be set
    await waitFor(() => {
      expect(result.current).toBe(mockSocket)
    })
  })
})

// ---------------------------------------------------------------------------
// useTaskEvents tests
// ---------------------------------------------------------------------------

describe('useTaskEvents', () => {
  it('returns initial state when no socket', () => {
    const { wrapper } = createQueryOnlyWrapper()
    const { result } = renderHook(() => useTaskEvents(), { wrapper })

    expect(result.current.lastEvent).toBeNull()
    expect(result.current.isConnected).toBe(false)
  })

  it('subscribes to all task event channels', async () => {
    const { wrapper } = createWrapper()
    renderHook(() => useTaskEvents(), { wrapper })

    // Wait for socket to be set in provider
    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('task_status_changed', expect.any(Function))
    })

    expect(mockSocket.on).toHaveBeenCalledWith('task_progress', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('task_completed', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('task_failed', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
  })

  it('sets isConnected to true when socket fires connect event', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useTaskEvents(), { wrapper })

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    })

    act(() => {
      emitMock('connect')
    })

    expect(result.current.isConnected).toBe(true)
  })

  it('sets isConnected to false when socket fires disconnect event', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useTaskEvents(), { wrapper })

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    })

    // First connect, then disconnect
    act(() => {
      emitMock('connect')
    })
    expect(result.current.isConnected).toBe(true)

    act(() => {
      emitMock('disconnect')
    })
    expect(result.current.isConnected).toBe(false)
  })

  it('updates lastEvent on task_status_changed', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useTaskEvents(), { wrapper })

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('task_status_changed', expect.any(Function))
    })

    const event = {
      task_id: 'task-1',
      task_name: 'process_data',
      status: 'running',
      total_steps: 5,
      completed_steps: 2,
      status_message: 'Processing...',
      error_detail: null,
      tenant_id: 'tenant-1',
    }

    act(() => {
      emitMock('task_status_changed', event)
    })

    expect(result.current.lastEvent).toEqual(event)
  })

  it('calls onStatusChange callback', async () => {
    const onStatusChange = jest.fn()
    const { wrapper } = createWrapper()
    renderHook(() => useTaskEvents({ onStatusChange }), { wrapper })

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('task_status_changed', expect.any(Function))
    })

    const event = {
      task_id: 'task-1',
      task_name: 'process_data',
      status: 'running',
      total_steps: null,
      completed_steps: 0,
      status_message: null,
      error_detail: null,
      tenant_id: 'tenant-1',
    }

    act(() => {
      emitMock('task_status_changed', event)
    })

    expect(onStatusChange).toHaveBeenCalledWith(event)
  })

  it('updates lastEvent on task_progress', async () => {
    const onProgress = jest.fn()
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useTaskEvents({ onProgress }), { wrapper })

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('task_progress', expect.any(Function))
    })

    const event = {
      task_id: 'task-1',
      completed_steps: 3,
      total_steps: 10,
      status_message: 'Step 3 of 10',
    }

    act(() => {
      emitMock('task_progress', event)
    })

    expect(result.current.lastEvent).toEqual(event)
    expect(onProgress).toHaveBeenCalledWith(event)
  })

  it('updates lastEvent on task_completed and invalidates queries', async () => {
    const onCompleted = jest.fn()
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useTaskEvents({ onCompleted }), { wrapper })

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('task_completed', expect.any(Function))
    })

    const event = {
      task_id: 'task-1',
      task_name: 'process_data',
      result_url: 'https://example.com/result',
      tenant_id: 'tenant-1',
    }

    act(() => {
      emitMock('task_completed', event)
    })

    expect(result.current.lastEvent).toEqual(event)
    expect(onCompleted).toHaveBeenCalledWith(event)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] })
  })

  it('updates lastEvent on task_failed and invalidates queries', async () => {
    const onFailed = jest.fn()
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useTaskEvents({ onFailed }), { wrapper })

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('task_failed', expect.any(Function))
    })

    const event = {
      task_id: 'task-1',
      task_name: 'process_data',
      error_detail: 'Connection timeout',
      tenant_id: 'tenant-1',
    }

    act(() => {
      emitMock('task_failed', event)
    })

    expect(result.current.lastEvent).toEqual(event)
    expect(onFailed).toHaveBeenCalledWith(event)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] })
  })

  it('filters events by taskId when provided', async () => {
    const onStatusChange = jest.fn()
    const { wrapper } = createWrapper()
    renderHook(() => useTaskEvents({ taskId: 'task-1', onStatusChange }), { wrapper })

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('task_status_changed', expect.any(Function))
    })

    const matchingEvent = {
      task_id: 'task-1',
      task_name: 'process_data',
      status: 'running',
      total_steps: null,
      completed_steps: 0,
      status_message: null,
      error_detail: null,
      tenant_id: 'tenant-1',
    }

    const otherEvent = {
      task_id: 'task-other',
      task_name: 'other_task',
      status: 'running',
      total_steps: null,
      completed_steps: 0,
      status_message: null,
      error_detail: null,
      tenant_id: 'tenant-1',
    }

    act(() => {
      emitMock('task_status_changed', otherEvent)
    })

    // Should NOT be called for non-matching task
    expect(onStatusChange).not.toHaveBeenCalled()

    act(() => {
      emitMock('task_status_changed', matchingEvent)
    })

    // Should be called for matching task
    expect(onStatusChange).toHaveBeenCalledWith(matchingEvent)
  })

  it('does not filter when no taskId is specified', async () => {
    const onStatusChange = jest.fn()
    const { wrapper } = createWrapper()
    renderHook(() => useTaskEvents({ onStatusChange }), { wrapper })

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('task_status_changed', expect.any(Function))
    })

    const event = {
      task_id: 'any-task',
      task_name: 'whatever',
      status: 'running',
      total_steps: null,
      completed_steps: 0,
      status_message: null,
      error_detail: null,
      tenant_id: 'tenant-1',
    }

    act(() => {
      emitMock('task_status_changed', event)
    })

    expect(onStatusChange).toHaveBeenCalledWith(event)
  })

  it('unsubscribes from events on unmount', async () => {
    const { wrapper } = createWrapper()
    const { unmount } = renderHook(() => useTaskEvents(), { wrapper })

    await waitFor(() => {
      expect(mockSocket.on).toHaveBeenCalledWith('task_status_changed', expect.any(Function))
    })

    unmount()

    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('task_status_changed', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('task_progress', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('task_completed', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('task_failed', expect.any(Function))
  })

  it('reflects socket.connected as initial isConnected state', async () => {
    mockSocket.connected = true
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useTaskEvents(), { wrapper })

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })
  })
})
