
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (isDevelopment) {
    return import.meta.env.VITE_API_BASE_URL_DEV || 'http://localhost:3000';
  }
  return import.meta.env.VITE_API_BASE_URL_PROD || 'https://ariesto-project.onrender.com';
};

export const config = {
  api: {
    baseUrl: getApiBaseUrl(),
  },
  restaurant: {
    id: import.meta.env.VITE_RESTAURANT_ID || 11100,
    name: import.meta.env.VITE_RESTAURANT_NAME || 'Супра',
    timezone: import.meta.env.VITE_TIMEZONE || 'Asia/Vladivostok',
  },
  grid: {
    timeSlotHeight: 50,
    timeSlotMinutes: 30,
    minTableWidth: 0,
    timeColumnWidth: 80,
  },
  colors: {
    orderNew: '#4caf50',
    orderBill: '#ff9800',
    orderClosed: '#2196f3',
    orderBanquet: '#9c27b0',
    reservation: '#f44336',
  },
};
