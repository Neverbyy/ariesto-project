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
        <div class="status-badge">{{ statusText }}</div>
        <div class="time-display">{{ orderTimeText }}</div>
        <div class="hover-extra compact" v-if="shouldShowExtraInfo">
          <div class="customer-info" v-if="(orderCustomerName && shouldShowCustomerName) || (orderPeopleText && shouldShowPeople)">
            <span v-if="orderCustomerName && shouldShowCustomerName">{{ orderCustomerName }}</span>
            <span v-if="orderCustomerName && shouldShowCustomerName && orderPeopleText && shouldShowPeople">; </span>
            <span v-if="orderPeopleText && shouldShowPeople">{{ orderPeopleText }}</span>
          </div>
          <div class="phone-text" v-if="orderPhoneFull && shouldShowPhone">📞 {{ orderPhoneFull }}</div>
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
import { computed, ref, onMounted } from 'vue';

import type { TableItem } from '../types/reservation';

interface Props {
  item: TableItem & { type: 'order' | 'reservation'; startTime?: string; endTime?: string; overlapIndex?: number };
  timeSlot: string;
  verticalScale: number;
  isSelected?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [item: TableItem];
  delete: [item: TableItem];
}>();

const isHovered = ref(false);

// Отслеживание масштаба - упрощенная версия
const scale = ref({ horizontalScale: 1, verticalScale: 1 });

// Обновляем масштаб при монтировании компонента
const updateScale = () => {
  const parentElement = document.querySelector('.reservation-grid-container');
  if (parentElement) {
    const styles = getComputedStyle(parentElement);
    const horizontalScale = parseFloat(styles.getPropertyValue('--horizontal-scale')) || 1;
    const verticalScale = parseFloat(styles.getPropertyValue('--vertical-scale')) || 1;
    scale.value = { horizontalScale, verticalScale };
  }
};

onMounted(() => {
  updateScale();
});

const itemClass = computed(() => {
  if (props.item.type === 'order') {
    if (props.item.status === 'Banquet') return 'order-banquet';
    if (props.item.status === 'Reservation') return 'order-reservation';
    if (props.item.status === 'LiveQueue') return 'order-live-queue';
    // Новый, Пречек, Закрытый → обычные заказы
    return 'order-regular';
  }
  // Бронирования
  if (props.item.status === 'Reservation') return 'reservation-regular';
  return 'reservation-regular';
});

// Вспомогательная функция для извлечения времени из ISO строки без проблем с часовым поясом
const extractTimeFromISO = (isoString: string): string => {
  const timeMatch = isoString.match(/T(\d{2}:\d{2}):\d{2}/);
  return timeMatch ? timeMatch[1] : '';
};

const itemStyle = computed(() => {
  try {
    const startTimeStr = props.item.type === 'order' ? props.item.start_time : props.item.seating_time;
    const endTimeStr = props.item.end_time;
    
    const startTime = extractTimeFromISO(startTimeStr || '');
    const endTime = extractTimeFromISO(endTimeStr || '');
    
    if (!startTime || !endTime) {
      return {
        height: '50px',
        top: '0px',
        marginLeft: '0px',
        zIndex: 10
      };
    }
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const duration = endTotalMinutes - startTotalMinutes;
    
    const timeSlotTime = props.timeSlot;
    const [slotHours, slotMinutes] = timeSlotTime.split(':').map(Number);
    const slotTotalMinutes = slotHours * 60 + slotMinutes;
    
    // Используем props.verticalScale напрямую вместо scale.value
    const verticalScale = props.verticalScale;
    const horizontalScale = 1; // Пока используем фиксированное значение
    
    // Отладочная информация для диагностики
    if (props.item.type === 'order' && duration > 30) {
      console.log(`Order ${props.item.id}: duration=${duration}min, verticalScale=${verticalScale}, timeSlot=${timeSlotTime}`);
    }
    
    // Правильный расчет смещения сверху
    // Если время начала заказа больше времени текущего слота,
    // то нужно сместить карточку вниз на соответствующее количество ячеек
    const topOffset = startTotalMinutes > slotTotalMinutes 
      ? Math.floor((startTotalMinutes - slotTotalMinutes) / 30) * 50 * verticalScale
      : 0;
    
    // Правильный расчет высоты с учетом масштаба
    // Базовая высота одной ячейки времени (30 минут) = 50px
    // При масштабе verticalScale каждая ячейка имеет высоту 50 * verticalScale
    const baseTimeSlotHeight = 50 * verticalScale;

    const timeSlotsCount = Math.max(1, Math.ceil((duration + 1) / 30));
    
    // Высота карточки = количество слотов * высота слота
    const itemHeight = timeSlotsCount * baseTimeSlotHeight;
    
    // Отладочная информация для диагностики
    if (props.item.type === 'order' && duration > 30) {
      console.log(`Order ${props.item.id}: duration=${duration}min, timeSlots=${timeSlotsCount}, height=${itemHeight}px, scale=${verticalScale}, baseHeight=${baseTimeSlotHeight}`);
    }
    
    const overlapOffset = (props.item.overlapIndex || 0) * 10 * horizontalScale;
    const baseZ = 10 + startTotalMinutes + (props.item.overlapIndex || 0);
    const zIndex = isHovered.value ? 2000 : baseZ;
    
    return {
      height: `${itemHeight}px`,
      top: `${topOffset}px`,
      marginLeft: `${overlapOffset}px`,
      zIndex: zIndex
    };
  } catch (error) {
    console.error('Error computing itemStyle:', error);
    return {
      height: '50px',
      top: '0px',
      marginLeft: '0px',
      zIndex: 10
    };
  }
});

const itemTitle = computed(() => props.item.type === 'order' ? 'Заказ' : props.item.name_for_reservation);

const reservationTimeText = computed(() => {
  if (props.item.type === 'reservation') {
    const startTime = extractTimeFromISO(props.item.seating_time || '');
    const endTime = extractTimeFromISO(props.item.end_time || '');
    return `${startTime}-${endTime}`;
  }
  return '';
});

const statusText = computed(() => {
  if (!props.item.status) return '';
  
  switch (props.item.status) {
    case 'New': return 'Новый';
    case 'Bill': return 'Пречек';
    case 'Closed': return 'Закрытый';
    case 'Banquet': return 'Банкет';
    case 'Reservation': return 'Бронирование';
    case 'LiveQueue': return 'Живая очередь';
    default: return props.item.status;
  }
});

const orderTimeText = computed(() => {
  const startTime = extractTimeFromISO(props.item.start_time || '');
  const endTime = extractTimeFromISO(props.item.end_time || '');
  return `${startTime}-${endTime}`;
});

const reservationStatusText = computed(() => {
  if (props.item.type !== 'reservation') return '';
  
  const statusMap: Record<string, string> = {
    'Reservation': 'Бронирование'
  };
  return statusMap[props.item.status] || props.item.status;
});
const reservationPeopleText = computed(() => props.item.type === 'reservation' ? `${props.item.num_people} чел` : '');
const phoneSuffix = computed(() => props.item.type === 'reservation' ? String(props.item.phone_number).slice(-4) : '');

// Для заказов
const orderCustomerName = computed(() => props.item.type === 'order' && props.item.customer_name ? props.item.customer_name : '');
const orderPhoneFull = computed(() => props.item.type === 'order' && props.item.customer_phone ? props.item.customer_phone : '');
const orderPeopleText = computed(() => props.item.type === 'order' && props.item.num_people ? `${props.item.num_people} чел` : '');

// Определяем, что показывать в зависимости от высоты заказа и масштаба
const shouldShowExtraInfo = computed(() => {
  if (props.item.type !== 'order') return false;
  if (props.verticalScale <= 0.5) return false;
  
  try {
    const itemHeight = itemStyle.value.height;
    const heightValue = parseInt(String(itemHeight));
    return heightValue >= 60;
  } catch {
    return false;
  }
});

const shouldShowCustomerName = computed(() => {
  if (props.item.type !== 'order') return false;
  if (props.verticalScale <= 0.5) return false;
  
  try {
    const itemHeight = itemStyle.value.height;
    const heightValue = parseInt(String(itemHeight));
    return heightValue >= 75;
  } catch {
    return false;
  }
});

const shouldShowPhone = computed(() => {
  if (props.item.type !== 'order') return false;
  if (props.verticalScale <= 0.5) return false;
  
  try {
    const itemHeight = itemStyle.value.height;
    const heightValue = parseInt(String(itemHeight));
    return heightValue >= 70;
  } catch {
    return false;
  }
});

const shouldShowPeople = computed(() => {
  if (props.item.type !== 'order') return false;
  if (props.verticalScale <= 0.5) return false;
  
  try {
    const itemHeight = itemStyle.value.height;
    const heightValue = parseInt(String(itemHeight));
    return heightValue >= 65;
  } catch {
    return false;
  }
});

const handleClick = () => emit('click', props.item);

const getDurationClass = () => {
  if (props.item.type !== 'order') return '';
  
  const startTimeStr = props.item.start_time;
  const endTimeStr = props.item.end_time;
  const startTime = extractTimeFromISO(startTimeStr || '');
  const endTime = extractTimeFromISO(endTimeStr || '');
  
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
      return 'Удалить бронирование';
    default:
      return 'Удалить';
  }
};

const handleDelete = () => {
  const itemType = props.item.type === 'order' ? 'заказ' : 'бронирование';
  
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

/* Поддержка темы для элементов бронирования */
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

/* Поддержка светлой темы */
:global(.light-theme) .status-badge {
  background-color: rgba(0,0,0,.15);
  color: #1a1a1a;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
  flex-direction: column;
  gap: 8px; 
  margin-top: 2px;
}

.hover-extra.compact {
  gap: 4px;
  margin-top: 1px;
}

.customer-info, .people-text, .phone-text { 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  font-size: 0.75rem; 
  opacity: 0.95; 
  margin: 0; 
}

.hover-extra.compact .customer-info,
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



/* Цвета согласно спецификации с использованием CSS переменных */
/* Обычные заказы (Новый, Пречек, Закрытый) */
.order-regular { 
  background-color: color-mix(in srgb, var(--card-order-regular) 25%, transparent); 
  border-left: 4px solid var(--card-order-regular); 
}

/* Банкет */
.order-banquet { 
  background-color: color-mix(in srgb, var(--card-order-banquet) 25%, transparent); 
  border-left: 4px solid var(--card-order-banquet); 
}

/* Бронирование (заказ) */
.order-reservation { 
  background-color: color-mix(in srgb, var(--card-reservation-regular) 25%, transparent); 
  border-left: 4px solid var(--card-reservation-regular); 
}

/* Живая очередь (заказ) */
.order-live-queue { 
  background-color: color-mix(in srgb, var(--card-reservation-live) 25%, transparent); 
  border-left: 4px solid var(--card-reservation-live); 
}

/* Живая очередь */
.reservation-live { 
  background-color: color-mix(in srgb, var(--card-reservation-live) 25%, transparent); 
  border-left: 4px solid var(--card-reservation-live); 
}

/* Бронирования (прочие статусы) */
.reservation-regular { 
  background-color: color-mix(in srgb, var(--card-reservation-regular) 25%, transparent); 
  border-left: 4px solid var(--card-reservation-regular); 
}

/* Специфичные стили для светлой темы для лучшего контраста */
:global(.light-theme) .order-regular { 
  background-color: color-mix(in srgb, var(--card-order-regular) 35%, transparent); 
  border-left: 5px solid var(--card-order-regular); 
  box-shadow: 0 2px 8px rgba(29, 78, 216, 0.15);
}

:global(.light-theme) .order-banquet { 
  background-color: color-mix(in srgb, var(--card-order-banquet) 35%, transparent); 
  border-left: 5px solid var(--card-order-banquet); 
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.15);
}

:global(.light-theme) .order-reservation { 
  background-color: color-mix(in srgb, var(--card-reservation-regular) 35%, transparent); 
  border-left: 5px solid var(--card-reservation-regular); 
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.15);
}

:global(.light-theme) .order-live-queue { 
  background-color: color-mix(in srgb, var(--card-reservation-live) 35%, transparent); 
  border-left: 5px solid var(--card-reservation-live); 
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
}

:global(.light-theme) .reservation-live { 
  background-color: color-mix(in srgb, var(--card-reservation-live) 35%, transparent); 
  border-left: 5px solid var(--card-reservation-live); 
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
}

:global(.light-theme) .reservation-regular { 
  background-color: color-mix(in srgb, var(--card-reservation-regular) 35%, transparent); 
  border-left: 5px solid var(--card-reservation-regular); 
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.15);
}

/* Mobile Responsive Styles for screens <= 460px */
@media (max-width: 460px) {
  .reservation-item {
    font-size: 10px;
    padding: 0.25rem;
    min-height: 35px;
    border-left-width: 3px;
  }

  .reservation-item .item-content {
    gap: 0.25rem;
    padding: 0.25rem;
  }

  .reservation-item .item-title {
    font-size: 0.75rem;
    line-height: 1.1;
    margin: 0;
  }

  .reservation-item .status-badge {
    font-size: 0.6rem;
    padding: 0.1rem 0.2rem;
    margin: 0;
  }

  .reservation-item .time-display {
    font-size: 0.7rem;
    line-height: 1;
    margin: 0;
  }

  .reservation-item .hover-extra {
    gap: 0.2rem;
    margin-top: 0.1rem;
  }

  .reservation-item .customer-info,
  .reservation-item .people-text,
  .reservation-item .phone-text {
    font-size: 0.65rem;
    line-height: 1.1;
  }

  /* Уменьшаем размеры для коротких заказов на мобильных */
  .reservation-item[data-duration="short"] .item-content {
    justify-content: space-between;
    padding: 0.1rem 0;
  }

  .reservation-item[data-duration="short"] .item-title {
    font-size: 0.7rem;
  }

  .reservation-item[data-duration="short"] .status-badge {
    font-size: 0.55rem;
    padding: 0.05rem 0.15rem;
  }

  .reservation-item[data-duration="short"] .time-display {
    font-size: 0.65rem;
  }

  /* Адаптация для максимального отдаления на мобильных */
  .reservation-item[data-scale="0.5"] .item-title {
    font-size: 0.7rem;
  }

  .reservation-item[data-scale="0.5"] .status-badge {
    font-size: 0.55rem;
    padding: 0.05rem 0.15rem;
  }

  .reservation-item[data-scale="0.5"] .time-display {
    font-size: 0.65rem;
  }

  /* Комбинированные стили для максимального отдаления + коротких заказов на мобильных */
  .reservation-item[data-scale="0.5"][data-duration="short"] .item-content {
    justify-content: space-between;
    padding: 0.05rem 0;
  }

  .reservation-item[data-scale="0.5"][data-duration="short"] .item-title {
    font-size: 0.65rem;
  }

  .reservation-item[data-scale="0.5"][data-duration="short"] .status-badge {
    font-size: 0.5rem;
    padding: 0.02rem 0.1rem;
  }

  .reservation-item[data-scale="0.5"][data-duration="short"] .time-display {
    font-size: 0.6rem;
  }

  /* Адаптация delete button для мобильных */
  .delete-button {
    width: 18px;
    height: 18px;
    font-size: 10px;
    right: 1px;
    top: 1px;
    border-radius: 50%;
  }
}

</style>
