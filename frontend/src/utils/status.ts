

const ORDER_STATUS_LABELS: Record<string, string> = {
  New: 'Новый',
  Bill: 'Пречек',
  Closed: 'Закрытый',
  Banquet: 'Банкет',
  Reservation: 'Бронирование',
  LiveQueue: 'Живая очередь',
};

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  Reservation: 'Бронирование',
};

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function getReservationStatusLabel(status: string): string {
  return RESERVATION_STATUS_LABELS[status] ?? status;
}

export function getItemClass(type: 'order' | 'reservation', status: string): string {
  if (type === 'order') {
    if (status === 'Banquet') return 'order-banquet';
    if (status === 'Reservation') return 'order-reservation';
    if (status === 'LiveQueue') return 'order-live-queue';
    return 'order-regular';
  }
  return 'reservation-regular';
}
