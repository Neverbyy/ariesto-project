import { computed, type Ref } from 'vue';
import type { Restaurant } from '../types/reservation';
import { generateTimeSlots } from '../utils/time';

export function useTimeSlots(restaurant: Ref<Restaurant | undefined>) {
  return computed(() => {
    if (!restaurant.value) return [];
    return generateTimeSlots(restaurant.value.opening_time, restaurant.value.closing_time);
  });
}
