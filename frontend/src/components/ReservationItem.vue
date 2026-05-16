<template>
  <div
    :class="['reservation-item', itemClass, { hovered: isHovered, selected: isSelected }]"
    :style="itemStyle"
    :data-scale="verticalScale"
    :data-duration="durationClass"
    @click="emit('click', props.item)"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="item-content">
      <template v-if="isOrder">
        <div class="item-title">Заказ</div>
        <div class="status-badge">{{ statusLabel }}</div>
        <div class="time-display">{{ timeText }}</div>
        <div class="hover-extra compact" v-if="display.showExtra">
          <div class="customer-info" v-if="(orderCustomerName && display.showCustomer) || (orderPeopleText && display.showPeople)">
            <span v-if="orderCustomerName && display.showCustomer">{{ orderCustomerName }}</span>
            <span v-if="orderCustomerName && display.showCustomer && orderPeopleText && display.showPeople">; </span>
            <span v-if="orderPeopleText && display.showPeople">{{ orderPeopleText }}</span>
          </div>
          <div class="phone-text" v-if="orderPhoneFull && display.showPhone">📞 {{ orderPhoneFull }}</div>
        </div>
      </template>

      <template v-else>
        <div class="item-title">{{ props.item.name_for_reservation }}</div>
        <div class="time-display">{{ timeText }}</div>
        <div class="status-badge">{{ statusLabel }}</div>
        <div class="hover-extra compact" v-if="phoneSuffix || reservationPeopleText">
          <div class="phone-text" v-if="phoneSuffix">📞 {{ phoneSuffix }}</div>
          <div class="people-text" v-if="reservationPeopleText">{{ reservationPeopleText }}</div>
        </div>
      </template>
    </div>

    <div
      v-if="isSelected"
      class="delete-button"
      :title="deleteButtonTitle"
      @click.stop="handleDelete"
    >
      ✖
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { App as AntApp } from 'ant-design-vue';
import type { TableItem } from '../types/reservation';
import { extractTimeFromISO, durationMinutes } from '../utils/time';
import { getOrderStatusLabel, getReservationStatusLabel, getItemClass } from '../utils/status';

interface GridItem extends TableItem {
  type: 'order' | 'reservation';
  startTime?: string;
  endTime?: string;
  overlapIndex?: number;
}

interface Props {
  item: GridItem;
  timeSlot: string;
  verticalScale: number;
  isSelected?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [item: TableItem];
  delete: [item: TableItem];
}>();

const BASE_SLOT_HEIGHT = 50;
const MINUTES_PER_SLOT = 30;

const isHovered = ref(false);
const isOrder = computed(() => props.item.type === 'order');

const itemClass = computed(() => getItemClass(props.item.type, props.item.status));

// Время начала/конца карточки (для order — start_time, для reservation — seating_time)
const startTime = computed(() => extractTimeFromISO(
  isOrder.value ? (props.item.start_time || '') : (props.item.seating_time || ''),
));
const endTime = computed(() => extractTimeFromISO(props.item.end_time || ''));
const timeText = computed(() => `${startTime.value}-${endTime.value}`);

const duration = computed(() => {
  if (!startTime.value || !endTime.value) return 0;
  return durationMinutes(startTime.value, endTime.value);
});

const durationClass = computed(() => {
  if (!isOrder.value) return '';
  if (duration.value < 60) return 'short';
  if (duration.value < 120) return 'medium';
  return 'long';
});

const statusLabel = computed(() =>
  isOrder.value
    ? getOrderStatusLabel(props.item.status)
    : getReservationStatusLabel(props.item.status),
);

// Геометрия карточки
const itemStyle = computed(() => {
  if (!startTime.value || !endTime.value) {
    return { height: '50px', top: '0px', marginLeft: '0px', zIndex: 10 };
  }

  const [startH, startM] = startTime.value.split(':').map(Number);
  const [endH, endM] = endTime.value.split(':').map(Number);
  const [slotH, slotM] = props.timeSlot.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const slotMinutes = slotH * 60 + slotM;
  const durationValue = endMinutes - startMinutes;

  const slotHeight = BASE_SLOT_HEIGHT * props.verticalScale;
  const topOffset = startMinutes > slotMinutes
    ? Math.floor((startMinutes - slotMinutes) / MINUTES_PER_SLOT) * slotHeight
    : 0;
  const slotsCount = Math.max(1, Math.ceil((durationValue + 1) / MINUTES_PER_SLOT));
  const overlapOffset = (props.item.overlapIndex ?? 0) * 10;
  const baseZ = 10 + startMinutes + (props.item.overlapIndex ?? 0);

  return {
    height: `${slotsCount * slotHeight}px`,
    top: `${topOffset}px`,
    marginLeft: `${overlapOffset}px`,
    zIndex: isHovered.value ? 2000 : baseZ,
  };
});

// Расчёт высоты карточки в пикселях, чтобы понять — что помещается
const itemHeightPx = computed(() => parseInt(String(itemStyle.value.height)) || 0);

// Какие блоки информации показывать на карточке (только для заказов и не на минимальном масштабе)
const display = computed(() => {
  if (!isOrder.value || props.verticalScale <= 0.5) {
    return { showExtra: false, showCustomer: false, showPhone: false, showPeople: false };
  }
  const h = itemHeightPx.value;
  return {
    showExtra: h >= 60,
    showCustomer: h >= 75,
    showPhone: h >= 70,
    showPeople: h >= 65,
  };
});

// Поля карточки для заказа
const orderCustomerName = computed(() => isOrder.value ? (props.item.customer_name || '') : '');
const orderPhoneFull = computed(() => isOrder.value ? (props.item.customer_phone || '') : '');
const orderPeopleText = computed(() =>
  isOrder.value && props.item.num_people ? `${props.item.num_people} чел` : '',
);

// Поля карточки для бронирования
const reservationPeopleText = computed(() =>
  !isOrder.value ? `${props.item.num_people} чел` : '',
);
const phoneSuffix = computed(() =>
  !isOrder.value ? String(props.item.phone_number ?? '').slice(-4) : '',
);

const deleteButtonTitle = computed(() =>
  isOrder.value ? 'Удалить заказ' : 'Удалить бронирование',
);

// modal из useApp() подхватывает тему из ConfigProvider
const { modal } = AntApp.useApp();

const handleDelete = () => {
  const itemType = isOrder.value ? 'заказ' : 'бронирование';
  modal.confirm({
    title: 'Подтверждение',
    content: `Вы уверены, что хотите удалить этот ${itemType}?`,
    okText: 'Удалить',
    okType: 'danger',
    cancelText: 'Отмена',
    centered: true,
    // Карточка в hover-состоянии имеет z-index 2000, а .delete-button внутри — 9999.
    // Перебиваем, чтобы модалка не оказалась под ними.
    zIndex: 10000,
    onOk: () => emit('delete', props.item),
  });
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
  color: var(--text-primary);
  box-sizing: border-box;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
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
  font-size: 0.85rem;
  line-height: 1.1;
  margin: 0;
}

.status-badge {
  background-color: rgba(74, 74, 74, .9);
  color: #ffffff;
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 500;
  white-space: nowrap;
}

:global(.light-theme) .status-badge {
  background-color: rgba(0, 0, 0, .15);
  color: #1a1a1a;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.time-display {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  font-size: 0.8rem;
  line-height: 1.1;
  margin: 0;
}

.hover-extra {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 2px;
}

.hover-extra.compact { gap: 4px; margin-top: 1px; }

.customer-info,
.people-text,
.phone-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.7rem;
  opacity: 0.95;
  margin: 0;
}

/* Короткие заказы (< 60 мин) */
.reservation-item[data-duration="short"] .item-content {
  justify-content: space-between;
  padding: 2px 0;
}
.reservation-item[data-duration="short"] .item-title { font-size: 0.8rem; line-height: 1; margin-top: 1px; }
.reservation-item[data-duration="short"] .status-badge { font-size: 0.6rem; padding: 0.03rem 0.25rem; margin: 1px 0; }
.reservation-item[data-duration="short"] .time-display { font-size: 0.75rem; line-height: 1; margin-bottom: 1px; }

/* Минимальный масштаб */
.reservation-item[data-scale="0.5"] .item-title { font-size: 0.8rem; line-height: 1; }
.reservation-item[data-scale="0.5"] .status-badge { font-size: 0.6rem; padding: 0.03rem 0.25rem; }
.reservation-item[data-scale="0.5"] .time-display { font-size: 0.75rem; line-height: 1; }

/* Короткий + минимальный масштаб */
.reservation-item[data-scale="0.5"][data-duration="short"] .item-content { padding: 1px 0; }
.reservation-item[data-scale="0.5"][data-duration="short"] .item-title { font-size: 0.75rem; margin-top: 0; }
.reservation-item[data-scale="0.5"][data-duration="short"] .status-badge { font-size: 0.55rem; padding: 0.02rem 0.2rem; margin: 0; }
.reservation-item[data-scale="0.5"][data-duration="short"] .time-display { font-size: 0.7rem; margin-bottom: 0; }

/* Цвета карточек согласно спецификации */
.order-regular {
  background-color: color-mix(in srgb, var(--card-order-regular) 25%, transparent);
  border-left: 4px solid var(--card-order-regular);
  min-height: 50px;
}
.order-banquet {
  background-color: color-mix(in srgb, var(--card-order-banquet) 25%, transparent);
  border-left: 4px solid var(--card-order-banquet);
  min-height: 50px;
}
.order-reservation {
  background-color: color-mix(in srgb, var(--card-reservation-regular) 25%, transparent);
  border-left: 4px solid var(--card-reservation-regular);
}
.order-live-queue {
  background-color: color-mix(in srgb, var(--card-reservation-live) 25%, transparent);
  border-left: 4px solid var(--card-reservation-live);
}
.reservation-regular {
  background-color: color-mix(in srgb, var(--card-reservation-regular) 25%, transparent);
  border-left: 4px solid var(--card-reservation-regular);
}

/* Светлая тема: усиленный контраст */
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
:global(.light-theme) .reservation-regular {
  background-color: color-mix(in srgb, var(--card-reservation-regular) 35%, transparent);
  border-left: 5px solid var(--card-reservation-regular);
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.15);
}

@media (max-width: 460px) {
  .reservation-item {
    font-size: 10px;
    padding: 0.25rem;
    min-height: 35px;
    border-left-width: 3px;
  }
  .item-content { gap: 0.25rem; padding: 0.25rem; }
  .item-title { font-size: 0.75rem; }
  .status-badge { font-size: 0.6rem; padding: 0.1rem 0.2rem; }
  .time-display { font-size: 0.7rem; }
  .hover-extra { gap: 0.2rem; margin-top: 0.1rem; }
  .customer-info,
  .people-text,
  .phone-text { font-size: 0.65rem; line-height: 1.1; }

  .reservation-item[data-duration="short"] .item-content { padding: 0.1rem 0; }
  .reservation-item[data-duration="short"] .item-title { font-size: 0.7rem; }
  .reservation-item[data-duration="short"] .status-badge { font-size: 0.55rem; padding: 0.05rem 0.15rem; }
  .reservation-item[data-duration="short"] .time-display { font-size: 0.65rem; }

  .reservation-item[data-scale="0.5"] .item-title { font-size: 0.7rem; }
  .reservation-item[data-scale="0.5"] .status-badge { font-size: 0.55rem; padding: 0.05rem 0.15rem; }
  .reservation-item[data-scale="0.5"] .time-display { font-size: 0.65rem; }

  .reservation-item[data-scale="0.5"][data-duration="short"] .item-content { padding: 0.05rem 0; }
  .reservation-item[data-scale="0.5"][data-duration="short"] .item-title { font-size: 0.65rem; }
  .reservation-item[data-scale="0.5"][data-duration="short"] .status-badge { font-size: 0.5rem; padding: 0.02rem 0.1rem; }
  .reservation-item[data-scale="0.5"][data-duration="short"] .time-display { font-size: 0.6rem; }

  .delete-button { width: 18px; height: 18px; font-size: 10px; right: 1px; top: 1px; }
}
</style>
