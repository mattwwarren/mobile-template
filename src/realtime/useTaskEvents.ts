import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useSocket } from './useSocket'

interface TaskStatusEvent {
  task_id: string
  task_name: string
  status: string
  total_steps: number | null
  completed_steps: number
  status_message: string | null
  error_detail: string | null
  tenant_id: string
}

interface TaskProgressEvent {
  task_id: string
  completed_steps: number
  total_steps: number | null
  status_message: string | null
}

interface TaskCompletedEvent {
  task_id: string
  task_name: string
  result_url: string | null
  tenant_id: string
}

interface TaskFailedEvent {
  task_id: string
  task_name: string
  error_detail: string | null
  tenant_id: string
}

type TaskEvent = TaskStatusEvent | TaskProgressEvent | TaskCompletedEvent | TaskFailedEvent

interface UseTaskEventsOptions {
  taskId?: string
  onStatusChange?: (event: TaskStatusEvent) => void
  onProgress?: (event: TaskProgressEvent) => void
  onCompleted?: (event: TaskCompletedEvent) => void
  onFailed?: (event: TaskFailedEvent) => void
}

interface UseTaskEventsReturn {
  lastEvent: TaskEvent | null
  isConnected: boolean
}

export function useTaskEvents(options: UseTaskEventsOptions = {}): UseTaskEventsReturn {
  const socket = useSocket()
  const queryClient = useQueryClient()
  const [lastEvent, setLastEvent] = useState<TaskEvent | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    if (!socket) {
      setIsConnected(false)
      return
    }

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    const matchesTask = (event: { task_id: string }) =>
      !optionsRef.current.taskId || event.task_id === optionsRef.current.taskId

    const onStatusChanged = (data: TaskStatusEvent) => {
      if (!matchesTask(data)) return
      setLastEvent(data)
      optionsRef.current.onStatusChange?.(data)
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }

    const onProgress = (data: TaskProgressEvent) => {
      if (!matchesTask(data)) return
      setLastEvent(data)
      optionsRef.current.onProgress?.(data)
    }

    const onCompleted = (data: TaskCompletedEvent) => {
      if (!matchesTask(data)) return
      setLastEvent(data)
      optionsRef.current.onCompleted?.(data)
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }

    const onFailed = (data: TaskFailedEvent) => {
      if (!matchesTask(data)) return
      setLastEvent(data)
      optionsRef.current.onFailed?.(data)
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('task_status_changed', onStatusChanged)
    socket.on('task_progress', onProgress)
    socket.on('task_completed', onCompleted)
    socket.on('task_failed', onFailed)

    setIsConnected(socket.connected)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('task_status_changed', onStatusChanged)
      socket.off('task_progress', onProgress)
      socket.off('task_completed', onCompleted)
      socket.off('task_failed', onFailed)
    }
  }, [socket, queryClient])

  return { lastEvent, isConnected }
}
