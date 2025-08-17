// Общие типы для фронтенда и бэкенда

export interface Restaurant {
  id: number;
  timezone: string;
  restaurant_name: string;
  opening_time: string;
  closing_time: string;
}

export interface Table {
  id: string;
  capacity: number;
  number: string;
  zone: string;
  orders: Order[];
  reservations: Reservation[];
}

export interface Order {
  id: string;
  status: OrderStatus;
  start_time: string;
  end_time: string;
  customer_name?: string;
  customer_phone?: string;
  num_people: number;
  table_id?: string;
  tables?: string[];
}

export interface Reservation {
  id: string;
  name_for_reservation: string;
  num_people: number;
  phone_number: string;
  status: ReservationStatus;
  seating_time: string;
  end_time: string;
}

export type OrderStatus = 'New' | 'Bill' | 'Closed' | 'Banquet' | 'Reservation' | 'LiveQueue';
export type ReservationStatus = 'Reservation' | 'LiveQueue' | 'Новая' | 'Открыт' | 'Заявка' | 'Живая очередь';

export interface ReservationData {
  available_days: string[];
  current_day: string;
  restaurant: Restaurant;
  tables: Table[];
}

export interface CreateOrderRequest {
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_phone: string;
  num_people: number;
  status: string;
  tables: string[];
}

export interface CreateOrderResponse {
  success: boolean;
  orders: Order[];
  message: string;
}

export interface DeleteOrderResponse {
  success: boolean;
  message: string;
}

export interface ZoneType {
  id: string;
  name: string;
}
