export interface Restaurant {
  id: number;
  timezone: string;
  restaurant_name: string;
  opening_time: string;
  closing_time: string;
}

// Unified item interface for both orders and reservations
export interface TableItem {
  id: string;
  status: 'New' | 'Bill' | 'Closed' | 'Banquet' | 'Reservation' | 'LiveQueue';
  start_time?: string;
  end_time?: string;
  seating_time?: string;
  customer_name?: string;
  customer_phone?: string;
  num_people?: number;
  phone_number?: string;
  name_for_reservation?: string;
  people?: number;
  table_id?: string;
}

export interface Table {
  id: string;
  capacity: number;
  number: string;
  zone: '1 этаж' | '2 этаж' | 'Банкетный зал';
  orders: TableItem[];
  reservations: TableItem[];
}

export interface ReservationData {
  available_days: string[];
  current_day: string;
  restaurant: Restaurant;
  tables: Table[];
}

export type ZoneType = '1 этаж' | '2 этаж' | 'Банкетный зал';
