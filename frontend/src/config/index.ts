export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://ariesto-project.onrender.com',
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

// Определяем окружение
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Автоматически определяем API URL в зависимости от окружения
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (isDevelopment) {
    return 'http://localhost:3000';
  }
  
  return 'https://ariesto-project.onrender.com';
};
