import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ItemListParams } from '@/api/items'
import { itemsApi } from '@/api/items'
import type { ItemCreate, ItemUpdate } from '@/api/types'

export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (params: ItemListParams) => [...itemKeys.lists(), params] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
  dashboardStats: () => [...itemKeys.all, 'dashboard-stats'] as const,
}

export function useItems(params: ItemListParams = {}) {
  return useQuery({
    queryKey: itemKeys.list(params),
    queryFn: () => itemsApi.list(params),
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => itemsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ItemCreate) => itemsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: itemKeys.dashboardStats() })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ItemUpdate }) => itemsApi.update(id, data),
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: itemKeys.dashboardStats() })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => itemsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: itemKeys.dashboardStats() })
    },
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: itemKeys.dashboardStats(),
    queryFn: () => itemsApi.dashboardStats(),
  })
}
