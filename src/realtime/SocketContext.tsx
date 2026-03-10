import * as SecureStore from 'expo-secure-store'
import { createContext, type ReactNode, useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { io, type Socket } from 'socket.io-client'
import { useAuth } from '@/auth'

const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

export const SocketContext = createContext<Socket | null>(null)

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { isAuthenticated } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const socketRef = useRef<Socket | null>(null)

  // Connect when authenticated, disconnect + cleanup when not
  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect any existing socket when auth is lost
      socketRef.current?.disconnect()
      socketRef.current = null
      setSocket(null)
      return
    }

    let cancelled = false

    const connect = async () => {
      const token = await SecureStore.getItemAsync('auth_token')
      if (!token || cancelled) return

      const newSocket = io(WS_URL, {
        path: '/ws/socket.io/',
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
      })

      newSocket.on('connect', () => {
        console.debug('[socket.io] connected', newSocket.id)
      })

      newSocket.on('connect_error', (err: Error) => {
        console.warn('[socket.io] connect_error', err.message)
      })

      newSocket.on('disconnect', (reason: string) => {
        console.debug('[socket.io] disconnected', reason)
      })

      socketRef.current = newSocket
      setSocket(newSocket)
    }

    void connect()

    // Handle app state changes: disconnect on background, reconnect on foreground
    const handleAppState = (nextState: AppStateStatus) => {
      const current = socketRef.current
      if (!current) return
      if (nextState === 'background' || nextState === 'inactive') {
        current.disconnect()
      } else if (nextState === 'active' && !current.connected) {
        current.connect()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppState)

    return () => {
      cancelled = true
      subscription.remove()
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}
