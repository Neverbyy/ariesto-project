import type { ReservationData } from '../types/reservation';
import { config } from '../config';

export class ReservationApiService {
  private baseUrl: string;

  constructor(baseUrl: string = config.api.baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getReservations(date: string): Promise<ReservationData> {
    const timestamp = Date.now();
    const random = Math.random();
    const response = await fetch(`${this.baseUrl}/api/reservations/${date}?_t=${timestamp}&_r=${random}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
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
}

export const reservationApi = new ReservationApiService();
