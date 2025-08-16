<template>
  <div
    :class="['reservation-item', itemClass, { hovered: isHovered }]"
    :style="itemStyle"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="item-content">
      <template v-if="props.item.type === 'order'">
        <div class="item-title">{{ itemTitle }}</div>
        <div class="status-badge">{{ orderStatusText }}</div>
        <div class="time-display">{{ orderTimeText }}</div>
      </template>
      
      <template v-else>
        <div class="item-title">{{ itemTitle }}</div>
        <div class="time-display">{{ reservationTimeText }}</div>
        <div class="status-badge">{{ reservationStatusText }}</div>
        <div class="hover-extra" v-if="showExtraInfo">
          <div class="phone-text">📞 {{ phoneSuffix }}</div>
          <div class="people-text">{{ reservationPeopleText }}</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';

interface Props {
  item: any;
  timeSlot: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [item: any];
}>();

const isHovered = ref(false);

// Reactive scale tracking
const scale = ref({ horizontalScale: 1, verticalScale: 1 });

// Update scale when component mounts and when parent scale changes
const updateScale = () => {
  const parentElement = document.querySelector('.reservation-grid-container');
  if (parentElement) {
    const styles = getComputedStyle(parentElement);
    const horizontalScale = parseFloat(styles.getPropertyValue('--horizontal-scale')) || 1;
    const verticalScale = parseFloat(styles.getPropertyValue('--vertical-scale')) || 1;
    scale.value = { horizontalScale, verticalScale };
  }
};

// Watch for scale changes by polling (since CSS custom properties don't trigger reactivity)
let scaleInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  updateScale();
  // Check for scale changes every 100ms
  scaleInterval = setInterval(updateScale, 100);
});

onUnmounted(() => {
  if (scaleInterval) {
    clearInterval(scaleInterval);
  }
});

const itemClass = computed(() => {
  if (props.item.type === 'order') {
    if (props.item.status === 'Banquet') return 'order-banquet';
    // New, Bill, Closed → обычные заказы
    return 'order-regular';
  }
  // Reservations
  if (props.item.status === 'Живая очередь') return 'reservation-live';
  return 'reservation-regular';
});

// Helper function to extract time from ISO string without timezone issues
const extractTimeFromISO = (isoString: string): string => {
  const timeMatch = isoString.match(/T(\d{2}:\d{2}):\d{2}/);
  return timeMatch ? timeMatch[1] : '';
};

const itemStyle = computed(() => {
  const startTimeStr = props.item.type === 'order' ? props.item.start_time : props.item.seating_time;
  const endTimeStr = props.item.end_time;
  
  const startTime = extractTimeFromISO(startTimeStr);
  const endTime = extractTimeFromISO(endTimeStr);
  
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  const duration = endTotalMinutes - startTotalMinutes;
  
  const timeSlotTime = props.timeSlot;
  const [slotHours, slotMinutes] = timeSlotTime.split(':').map(Number);
  const slotTotalMinutes = slotHours * 60 + slotMinutes;
  
  const { horizontalScale, verticalScale } = scale.value;
  
  const topOffset = startTotalMinutes > slotTotalMinutes 
    ? ((startTotalMinutes - slotTotalMinutes) / 30) * 50 * verticalScale
    : 0;
  
  // Вычисляем высоту карточки на основе продолжительности заказа с учетом масштаба
  const itemHeight = Math.max(
    50 * verticalScale, // Минимальная высота
    (duration / 30) * 50 * verticalScale // Высота по продолжительности
  );
  
  const overlapOffset = (props.item.overlapIndex || 0) * 10 * horizontalScale;
  const baseZ = 10 + startTotalMinutes + (props.item.overlapIndex || 0);
  const zIndex = isHovered.value ? 2000 : baseZ;
  
  // Debug logging for table 28
  if (props.item.id && props.item.id.includes('28')) {
    console.log(`ReservationItem ${props.item.id}: overlapIndex=${props.item.overlapIndex}, overlapOffset=${overlapOffset}px`);
  }
  
  return {
    height: `${itemHeight}px`,
    top: `${topOffset}px`,
    marginLeft: `${overlapOffset}px`,
    zIndex: zIndex
  } as Record<string, string | number>;
});

const itemTitle = computed(() => props.item.type === 'order' ? 'Заказ' : props.item.name_for_reservation);

const reservationTimeText = computed(() => {
  if (props.item.type === 'reservation') {
    const startTime = extractTimeFromISO(props.item.seating_time);
    const endTime = extractTimeFromISO(props.item.end_time);
    return `${startTime}-${endTime}`;
  }
  return '';
});

const orderStatusText = computed(() => {
  const statusMap: Record<string, string> = {
    'New': 'Новый',
    'Bill': 'Пречек',
    'Closed': 'Закрытый',
    'Banquet': 'Банкет'
  };
  return statusMap[props.item.status] || props.item.status;
});

const orderTimeText = computed(() => {
  const startTime = extractTimeFromISO(props.item.start_time);
  const endTime = extractTimeFromISO(props.item.end_time);
  return `${startTime}-${endTime}`;
});

const reservationStatusText = computed(() => props.item.type === 'reservation' ? props.item.status : '');
const reservationPeopleText = computed(() => props.item.type === 'reservation' ? `${props.item.num_people} чел` : '');
const phoneSuffix = computed(() => props.item.type === 'reservation' ? String(props.item.phone_number).slice(-4) : '');

// Определяем, показывать ли дополнительную информацию (телефон и количество людей)
const showExtraInfo = computed(() => {
  if (props.item.type !== 'reservation') return false;
  
  // Получаем продолжительность бронирования
  const startTimeStr = props.item.seating_time;
  const endTimeStr = props.item.end_time;
  
  const startTime = extractTimeFromISO(startTimeStr);
  const endTime = extractTimeFromISO(endTimeStr);
  
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  const duration = endTotalMinutes - startTotalMinutes;
  
  // Показываем дополнительную информацию только для бронирований с маленьким диапазоном (менее 2 часов)
  return duration < 120; // 120 минут = 2 часа
});

const handleClick = () => emit('click', props.item);
</script>

<style scoped>
.reservation-item {
  position: absolute;
  left: 2px;
  right: 2px;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #ffffff;
  box-sizing: border-box;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

/* Theme support for reservation items */
.reservation-item {
  color: var(--text-primary);
}

.reservation-item.hovered {
  transform: scale(1.02);
  box-shadow: 0 6px 16px rgba(0, 0, 0);
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
  text-align: left;
}

.item-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  font-size: 0.9rem;
  margin: 0;
}

.status-badge {
  background-color: rgba(74,74,74,.9);
  color: #ffffff;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
}

/* Light theme support */
:global(.light-theme) .status-badge {
  background-color: rgba(0,0,0,.1);
  color: #333333;
}

.time-display { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; font-size: 0.9rem; margin: 0; }
.hover-extra { display: flex; gap: 8px; align-items: center; }
.people-text, .phone-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.75rem; opacity: 0.95; margin: 0; }



/* Colors per spec using CSS variables */
/* Обычные заказы (Новый, Пречек, Закрытый) */
.order-regular { 
  background-color: color-mix(in srgb, var(--card-order-regular) 15%, transparent); 
  border-left: 3px solid var(--card-order-regular); 
}

/* Банкет */
.order-banquet { 
  background-color: color-mix(in srgb, var(--card-order-banquet) 15%, transparent); 
  border-left: 3px solid var(--card-order-banquet); 
}

/* Живая очередь */
.reservation-live { 
  background-color: color-mix(in srgb, var(--card-reservation-live) 15%, transparent); 
  border-left: 3px solid var(--card-reservation-live); 
}

/* Бронирования (прочие статусы) */
.reservation-regular { 
  background-color: color-mix(in srgb, var(--card-reservation-regular) 15%, transparent); 
  border-left: 3px solid var(--card-reservation-regular); 
}

</style>
