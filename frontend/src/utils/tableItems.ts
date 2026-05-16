import type { Table, TableItem } from '../types/reservation';
import { extractTimeFromISO, doTimeRangesOverlap } from './time';

export type GridItem = TableItem & {
  type: 'order' | 'reservation';
  startTime: string;
  endTime: string;
  overlapIndex: number;
};

type RawItem = GridItem;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function buildItemsForTable(table: Table): RawItem[] {
  const items: RawItem[] = [];

  table.orders.forEach((order) => {
    items.push({
      ...order,
      type: 'order',
      startTime: extractTimeFromISO(order.start_time || ''),
      endTime: extractTimeFromISO(order.end_time || ''),
      overlapIndex: 0,
    } as RawItem);
  });

  table.reservations.forEach((reservation) => {
    items.push({
      ...reservation,
      type: 'reservation',
      startTime: extractTimeFromISO(reservation.seating_time || ''),
      endTime: extractTimeFromISO(reservation.end_time || ''),
      overlapIndex: 0,
    } as RawItem);
  });

  return items.map((item) => {
    const overlapping = items.filter((other) =>
      !(other.id === item.id && other.type === item.type)
      && doTimeRangesOverlap(item.startTime, item.endTime, other.startTime, other.endTime),
    );

    if (overlapping.length === 0) {
      return { ...item, overlapIndex: 0 };
    }

    const group = [item, ...overlapping].sort((a, b) => {
      const aMin = toMinutes(a.startTime);
      const bMin = toMinutes(b.startTime);
      if (aMin !== bMin) return aMin - bMin;

      if (a.type !== b.type) return a.type === 'order' ? -1 : 1;
      if (a.type === 'reservation') {
        if (a.status === 'Reservation' && b.status !== 'Reservation') return -1;
        if (a.status !== 'Reservation' && b.status === 'Reservation') return 1;
      }
      return 0;
    });

    return {
      ...item,
      overlapIndex: group.findIndex((g) => g.id === item.id && g.type === item.type),
    };
  });
}

export function getItemsForTableAndTime(table: Table, timeSlot: string): GridItem[] {
  const allItems = buildItemsForTable(table);
  const seen = new Set<string>();
  const result: GridItem[] = [];

  for (const item of allItems) {
    const key = `${item.id}-${item.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (item.startTime === timeSlot) result.push(item);
  }

  return result;
}
