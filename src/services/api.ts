import type { ReservationData } from '../types/reservation';
import { config } from '../config';

export class ReservationApiService {
  private baseUrl: string;

  constructor(baseUrl: string = config.api.baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getReservations(date: string): Promise<ReservationData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/reservations?date=${date}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reservations:', error);
      throw error;
    }
  }

  async searchReservations(query: string): Promise<ReservationData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/reservations/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching reservations:', error);
      throw error;
    }
  }
}

export const reservationApi = new ReservationApiService();
