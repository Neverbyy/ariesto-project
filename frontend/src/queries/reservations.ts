import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { unref, h } from 'vue'
import { App as AntApp } from 'ant-design-vue'
import { CloseCircleFilled } from '@ant-design/icons-vue'
import { reservationApi } from '../services/api'
import type { TableItem } from '../types/reservation'

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Неизвестная ошибка'

// Красный крестик из Ant Design (тот же, что у message.error)
const renderRedCrossIcon = () =>
  h(CloseCircleFilled, { style: 'color: #ff4d4f' })

export const reservationKeys = {
  all: ['reservations'] as const,
  byDate: (date: string) => ['reservations', 'date', date] as const,
  search: (query: string) => ['reservations', 'search', query] as const,
}

export function useReservationsByDate(date: MaybeRef<string>) {
  return useQuery({
    queryKey: ['reservations', 'date', date],
    queryFn: () => reservationApi.getReservations(unref(date)),
    enabled: () => !!unref(date),
  })
}

export function useSearchReservations(query: MaybeRef<string>) {
  return useQuery({
    queryKey: ['reservations', 'search', query],
    queryFn: () => reservationApi.searchReservations(unref(query)),
    enabled: () => !!unref(query).trim(),
  })
}

export function useCreateOrder(activeDate: MaybeRef<string>) {
  const qc = useQueryClient()
  // useApp() — themed message/modal, подхватывает тёмную/светлую тему из ConfigProvider
  const { message } = AntApp.useApp()
  return useMutation({
    mutationFn: (orderData: Parameters<typeof reservationApi.createOrder>[0]) =>
      reservationApi.createOrder(orderData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reservationKeys.byDate(unref(activeDate)) })
      message.success('Заказ успешно создан')
    },
    onError: (error) => {
      message.error(`Ошибка при создании заказа: ${getErrorMessage(error)}`)
    },
  })
}

export function useDeleteOrder(activeDate: MaybeRef<string>) {
  const qc = useQueryClient()
  const { message } = AntApp.useApp()
  return useMutation({
    mutationFn: (item: TableItem) => reservationApi.deleteOrder(item.id),
    onSuccess: (_, item) => {
      qc.invalidateQueries({ queryKey: reservationKeys.byDate(unref(activeDate)) })
      const itemType = item.type === 'order' ? 'Заказ' : 'Бронирование'
      message.open({
        content: `${itemType} успешно удалён`,
        icon: renderRedCrossIcon,
      })
    },
    onError: (error, item) => {
      const itemType = item.type === 'order' ? 'заказа' : 'бронирования'
      message.error(`Ошибка при удалении ${itemType}: ${getErrorMessage(error)}`)
    },
  })
}
