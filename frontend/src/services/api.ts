import type { ReservationData, TableItem } from '../types/reservation';
import { config } from '../config';

export class ReservationApiService {
  private baseUrl: string;

  constructor(baseUrl: string = config.api.baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getReservations(date: string): Promise<ReservationData> {
    const response = await fetch(`${this.baseUrl}/api/reservations/${date}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async searchReservations(query: string): Promise<ReservationData> {
    const response = await fetch(`${this.baseUrl}/api/reservations/search/${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async createOrder(orderData: {
    start_time: string;
    end_time: string;
    customer_name: string;
    customer_phone: string;
    num_people: number;
    status: string;
    tables: string[];
  }): Promise<{ success: boolean; orders: TableItem[]; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async deleteOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/orders/${orderId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

export const reservationApi = new ReservationApiService();
