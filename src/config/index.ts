export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  },
  restaurant: {
    id: import.meta.env.VITE_RESTAURANT_ID || 11100,
    name: import.meta.env.VITE_RESTAURANT_NAME || 'Супра',
    timezone: import.meta.env.VITE_TIMEZONE || 'Asia/Vladivostok',
  },
  grid: {
    timeSlotHeight: 50, // высота временного слота в пикселях
    timeSlotMinutes: 30, // длительность временного слота в минутах
    minTableWidth: 0, // минимальная ширина колонки стола (0 для растягивания)
    timeColumnWidth: 80, // ширина колонки времени
  },
  colors: {
    orderNew: '#4caf50',
    orderBill: '#ff9800',
    orderClosed: '#2196f3',
    orderBanquet: '#9c27b0',
    reservation: '#f44336',
  },
};
