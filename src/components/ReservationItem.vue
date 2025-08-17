<template>
  <div
    :class="['reservation-item', itemClass, { hovered: isHovered, selected: isSelected }]"
    :style="itemStyle"
    :data-scale="verticalScale"
    :data-duration="getDurationClass()"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="item-content">
      <template v-if="props.item.type === 'order'">
        <div class="item-title">{{ itemTitle }}</div>
        <div class="status-badge">{{ orderStatusText }}</div>
        <div class="time-display">{{ orderTimeText }}</div>
        <div class="hover-extra compact" v-if="shouldShowExtraInfo">
          <div class="phone-text" v-if="orderPhoneSuffix && shouldShowPhone">📞 {{ orderPhoneSuffix }}</div>
          <div class="people-text" v-if="orderPeopleText && shouldShowPeople">{{ orderPeopleText }}</div>
        </div>
      </template>
      
      <template v-else>
        <div class="item-title">{{ itemTitle }}</div>
        <div class="time-display">{{ reservationTimeText }}</div>
        <div class="status-badge">{{ reservationStatusText }}</div>
        <div class="hover-extra compact" v-if="phoneSuffix || reservationPeopleText">
          <div class="phone-text" v-if="phoneSuffix">📞 {{ phoneSuffix }}</div>
          <div class="people-text" v-if="reservationPeopleText">{{ reservationPeopleText }}</div>
        </div>
      </template>
    </div>
    
    <!-- Delete button for selected items -->
    <div 
      v-if="isSelected" 
      class="delete-button"
      @click.stop="handleDelete"
      :title="getDeleteButtonTitle()"
    >
      ✖
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';

interface Props {
  item: any;
  timeSlot: string;
  verticalScale: number;
  isSelected?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [item: any];
  delete: [item: any];
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
    if (props.item.status === 'Reservation') return 'order-reservation';
    if (props.item.status === 'LiveQueue') return 'order-live-queue';
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
  // Увеличиваем минимальную высоту для заказов с дополнительной информацией
  let minHeight = 50 * verticalScale;
  
  // Для заказов с дополнительной информацией (телефон, количество людей) увеличиваем минимальную высоту
  if (props.item.type === 'order') {
    const hasExtraInfo = props.item.customer_phone || props.item.num_people;
    if (hasExtraInfo) {
      minHeight = Math.max(minHeight, 70 * verticalScale); // Минимум 70px для заказов с доп. информацией
    }
    
    // Для заказов с короткой длительностью (менее 1 часа) устанавливаем минимальную высоту
    if (duration < 60) {
      minHeight = Math.max(minHeight, 90 * verticalScale); // Минимум 90px для коротких заказов
    }
    
    // Для очень коротких заказов (менее 30 минут) дополнительно увеличиваем минимальную высоту
    if (duration < 30) {
      minHeight = Math.max(minHeight, 100 * verticalScale); // Минимум 100px для очень коротких заказов
    }
    
    // Для заказов с очень коротким временем (менее 15 минут) устанавливаем минимальную высоту для основной информации
    if (duration < 15) {
      minHeight = Math.max(minHeight, 80 * verticalScale); // Минимум 80px для отображения основной информации
    }
  }
  
  // Исправляем расчет высоты: добавляем 1 ячейку (50px) для корректного отображения
  // Это компенсирует то, что карточка должна занимать полную высоту от начала до конца времени
  const itemHeight = Math.max(
    minHeight, // Минимальная высота (адаптивная)
    ((duration / 30) * 50 + 50) * verticalScale // Высота по продолжительности + 1 ячейка
  );
  
  const overlapOffset = (props.item.overlapIndex || 0) * 10 * horizontalScale;
  const baseZ = 10 + startTotalMinutes + (props.item.overlapIndex || 0);
  const zIndex = isHovered.value ? 2000 : baseZ;
  
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
    'Banquet': 'Банкет',
    'Reservation': 'Бронирование',
    'LiveQueue': 'Очередь'
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

// Для заказов
const orderPhoneSuffix = computed(() => props.item.type === 'order' && props.item.customer_phone ? String(props.item.customer_phone).slice(-4) : '');
const orderPeopleText = computed(() => props.item.type === 'order' && props.item.num_people ? `${props.item.num_people} чел` : '');

// Определяем, что показывать в зависимости от высоты заказа и масштаба
const shouldShowExtraInfo = computed(() => {
  if (props.item.type !== 'order') return false;
  
  // При максимальном отдалении масштаба (verticalScale = 0.5), скрываем всю дополнительную информацию
  if (props.verticalScale <= 0.5) {
    return false;
  }
  
  // Получаем текущую высоту элемента
  const itemHeight = itemStyle.value.height;
  const heightValue = parseInt(String(itemHeight));
  
  // Если высота меньше 60px, показываем только основную информацию
  return heightValue >= 60;
});

const shouldShowPhone = computed(() => {
  if (props.item.type !== 'order') return false;
  
  // При максимальном отдалении масштаба (verticalScale = 0.5), скрываем телефон
  if (props.verticalScale <= 0.5) {
    return false;
  }
  
  const itemHeight = itemStyle.value.height;
  const heightValue = parseInt(String(itemHeight));
  
  // Телефон показываем только если высота позволяет
  return heightValue >= 70;
});

const shouldShowPeople = computed(() => {
  if (props.item.type !== 'order') return false;
  
  // При максимальном отдалении масштаба (verticalScale = 0.5), скрываем количество людей
  if (props.verticalScale <= 0.5) {
    return false;
  }
  
  const itemHeight = itemStyle.value.height;
  const heightValue = parseInt(String(itemHeight));
  
  // Количество людей показываем только если высота позволяет
  return heightValue >= 65;
});

const handleClick = () => emit('click', props.item);

const getDurationClass = () => {
  if (props.item.type !== 'order') return '';
  
  const startTimeStr = props.item.start_time;
  const endTimeStr = props.item.end_time;
  const startTime = extractTimeFromISO(startTimeStr);
  const endTime = extractTimeFromISO(endTimeStr);
  
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  const duration = endTotalMinutes - startTotalMinutes;
  
  if (duration < 60) return 'short';
  if (duration < 120) return 'medium';
  return 'long';
};

const getDeleteButtonTitle = () => {
  switch (props.item.type) {
    case 'order':
      return 'Удалить заказ';
    case 'reservation':
      if (props.item.status === 'Живая очередь') {
        return 'Удалить из живой очереди';
      }
      return 'Удалить бронирование';
    default:
      return 'Удалить';
  }
};

const handleDelete = () => {
  const itemType = props.item.type === 'order' ? 'заказ' : 
                   props.item.status === 'Живая очередь' ? 'запись из живой очереди' : 'бронирование';
  
  if (confirm(`Вы уверены, что хотите удалить этот ${itemType}?`)) {
    emit('delete', props.item);
  }
};
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

.reservation-item.selected {
  border: 2px solid #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
}

.delete-button {
  position: absolute !important;
  right: 8px !important;
  top: 8px !important;
  background-color: #ef4444 !important;
  color: white !important;
  border: 2px solid #dc2626 !important;
  border-radius: 50% !important;
  width: 20px !important;
  height: 20px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  font-size: 12px !important;
  font-weight: bold !important;
  transition: all 0.2s ease !important;
  z-index: 9999 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
}

.delete-button:hover {
  background-color: #dc2626 !important;
  border-color: #b91c1c !important;
  transform: scale(1.1) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-start;
  text-align: left;
  justify-content: flex-start;
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

.time-display { 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  font-weight: 600; 
  font-size: 0.9rem; 
  margin: 0; 
}

.hover-extra { 
  display: flex; 
  gap: 8px; 
  align-items: center; 
  margin-top: 2px;
}

.hover-extra.compact {
  gap: 4px;
  margin-top: 1px;
}

.people-text, .phone-text { 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  font-size: 0.75rem; 
  opacity: 0.95; 
  margin: 0; 
}

.hover-extra.compact .people-text,
.hover-extra.compact .phone-text {
  font-size: 0.7rem;
}

/* Специальные стили для коротких заказов */
.reservation-item.order-regular,
.reservation-item.order-banquet {
  min-height: 50px;
}

/* Уменьшаем отступы для коротких заказов */
.reservation-item .item-title {
  font-size: 0.85rem;
  line-height: 1.1;
}

.reservation-item .status-badge {
  font-size: 0.65rem;
  padding: 0.05rem 0.3rem;
}

.reservation-item .time-display {
  font-size: 0.8rem;
  line-height: 1.1;
}

/* Специальные стили для очень коротких заказов */
.reservation-item[data-duration="short"] .item-content {
  justify-content: space-between;
  padding: 2px 0;
}

.reservation-item[data-duration="short"] .item-title {
  font-size: 0.8rem;
  line-height: 1;
  margin-top: 1px;
}

.reservation-item[data-duration="short"] .status-badge {
  font-size: 0.6rem;
  padding: 0.03rem 0.25rem;
  margin: 1px 0;
}

.reservation-item[data-duration="short"] .time-display {
  font-size: 0.75rem;
  line-height: 1;
  margin-bottom: 1px;
}

.reservation-item[data-scale="0.5"] .item-title {
  font-size: 0.8rem;
  line-height: 1;
}

.reservation-item[data-scale="0.5"] .status-badge {
  font-size: 0.6rem;
  padding: 0.03rem 0.25rem;
}

.reservation-item[data-scale="0.5"] .time-display {
  font-size: 0.75rem;
  line-height: 1;
}

/* Комбинированные стили для максимального отдаления + коротких заказов */
.reservation-item[data-scale="0.5"][data-duration="short"] .item-content {
  justify-content: space-between;
  padding: 1px 0;
}

.reservation-item[data-scale="0.5"][data-duration="short"] .item-title {
  font-size: 0.75rem;
  margin-top: 0;
}

.reservation-item[data-scale="0.5"][data-duration="short"] .status-badge {
  font-size: 0.55rem;
  padding: 0.02rem 0.2rem;
  margin: 0;
}

.reservation-item[data-scale="0.5"][data-duration="short"] .time-display {
  font-size: 0.7rem;
  margin-bottom: 0;
}



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

/* Бронирование (заказ) */
.order-reservation { 
  background-color: color-mix(in srgb, var(--card-reservation-regular) 15%, transparent); 
  border-left: 3px solid var(--card-reservation-regular); 
}

/* Живая очередь (заказ) */
.order-live-queue { 
  background-color: color-mix(in srgb, var(--card-reservation-live) 15%, transparent); 
  border-left: 3px solid var(--card-reservation-live); 
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
