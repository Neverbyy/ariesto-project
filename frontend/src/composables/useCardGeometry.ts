import { computed, type ComputedRef, type CSSProperties, type Ref } from 'vue';
import { config } from '../config';
import { durationMinutes, extractTimeFromISO, toMinutes } from '../utils/time';
import type { GridItem } from '../utils/tableItems';

export type DurationClass = '' | 'short' | 'medium' | 'long';

interface UseCardGeometryParams {
  item: Ref<GridItem>;
  timeSlot: Ref<string>;
  verticalScale: Ref<number>;
  isHovered: Ref<boolean>;
  isToday: Ref<boolean | undefined>;
  currentMinutes: Ref<number | undefined>;
  isOrder: Ref<boolean>;
}

interface UseCardGeometryReturn {
  startTime: ComputedRef<string>;
  endTime: ComputedRef<string>;
  timeText: ComputedRef<string>;
  duration: ComputedRef<number>;
  durationClass: ComputedRef<DurationClass>;
  isPast: ComputedRef<boolean>;
  itemStyle: ComputedRef<CSSProperties>;
}

const { timeSlotHeight: BASE_SLOT_HEIGHT, timeSlotMinutes: MINUTES_PER_SLOT } = config.grid;

export function useCardGeometry(params: UseCardGeometryParams): UseCardGeometryReturn {
  const { item, timeSlot, verticalScale, isHovered, isToday, currentMinutes, isOrder } = params;

  const startTime = computed(() => extractTimeFromISO(
    isOrder.value ? (item.value.start_time || '') : (item.value.seating_time || ''),
  ));
  const endTime = computed(() => extractTimeFromISO(item.value.end_time || ''));
  const timeText = computed(() => `${startTime.value}-${endTime.value}`);

  const duration = computed(() =>
    startTime.value && endTime.value ? durationMinutes(startTime.value, endTime.value) : 0,
  );

  const durationClass = computed<DurationClass>(() => {
    if (!isOrder.value) return '';
    if (duration.value < 60) return 'short';
    if (duration.value < 120) return 'medium';
    return 'long';
  });

  const isPast = computed(() => {
    if (!isToday.value || currentMinutes.value === undefined || !endTime.value) return false;
    return toMinutes(endTime.value) <= currentMinutes.value;
  });

  const itemStyle = computed<CSSProperties>(() => {
    if (!startTime.value || !endTime.value) {
      return { height: '50px', top: '0px', marginLeft: '0px', zIndex: 10 };
    }

    const startMinutes = toMinutes(startTime.value);
    const endMinutes = toMinutes(endTime.value);
    const slotMinutes = toMinutes(timeSlot.value);
    const durationValue = endMinutes - startMinutes;

    const slotHeight = BASE_SLOT_HEIGHT * verticalScale.value;
    const topOffset = startMinutes > slotMinutes
      ? Math.floor((startMinutes - slotMinutes) / MINUTES_PER_SLOT) * slotHeight
      : 0;
    const slotsCount = Math.max(1, Math.ceil((durationValue + 1) / MINUTES_PER_SLOT));
    const overlapOffset = (item.value.overlapIndex ?? 0) * 10;
    const baseZ = 10 + startMinutes + (item.value.overlapIndex ?? 0);

    return {
      height: `${slotsCount * slotHeight}px`,
      top: `${topOffset}px`,
      marginLeft: `${overlapOffset}px`,
      zIndex: isHovered.value ? 2000 : baseZ,
    };
  });

  return { startTime, endTime, timeText, duration, durationClass, isPast, itemStyle };
}
