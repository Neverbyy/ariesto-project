<template>
  <ReservationItemTooltip :lines="tooltipLines">
    <div
      ref="cardEl"
      :class="['reservation-item', itemClass, {
        hovered: isHovered,
        selected: isSelected,
        'past-item': isPast,
        'search-match': isSearchMatch,
        'search-dimmed': isSearchActive && !isSearchMatch,
      }]"
      :style="itemStyle"
      :data-scale="verticalScale"
      :data-duration="durationClass"
      @click="emit('click', props.item)"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <div class="item-content">
        <template v-if="fields.type === 'order'">
          <div class="item-title">{{ fields.title }}</div>
          <div class="status-badge">{{ fields.badge }}</div>
          <div class="time-display">{{ fields.time }}</div>
          <div v-if="display.showExtra" class="hover-extra compact">
            <div v-if="customerLine" class="extra-line">{{ customerLine }}</div>
            <div v-if="fields.phone && display.showPhone" class="extra-line">📞 {{ fields.phone }}</div>
          </div>
        </template>

        <template v-else>
          <div class="item-title">{{ fields.title }}</div>
          <div class="time-display">{{ fields.time }}</div>
          <div class="status-badge">{{ fields.badge }}</div>
          <div v-if="display.showExtra && (fields.phone || fields.people)" class="hover-extra compact">
            <div v-if="fields.phone && display.showPhone" class="extra-line">📞 {{ fields.phone }}</div>
            <div v-if="fields.people && display.showPeople" class="extra-line">{{ fields.people }}</div>
          </div>
        </template>
      </div>

      <div
        v-if="isSelected"
        class="delete-button"
        :title="deleteButtonTitle"
        @click.stop="handleDelete"
      >✖</div>
    </div>
  </ReservationItemTooltip>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { App as AntApp } from 'ant-design-vue';
import type { TableItem } from '../types/reservation';
import { getOrderStatusLabel, getReservationStatusLabel, getItemClass } from '../utils/status';
import { useCardOverflow } from '../composables/useCardOverflow';
import { useCardGeometry } from '../composables/useCardGeometry';
import { useCardFields } from '../composables/useCardFields';
import type { GridItem } from '../utils/tableItems';
import ReservationItemTooltip from './ReservationItemTooltip.vue';

interface Props {
  item: GridItem;
  timeSlot: string;
  verticalScale: number;
  isSelected?: boolean;
  isToday?: boolean;
  currentMinutes?: number;
  isSearchActive?: boolean;
  isSearchMatch?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [item: TableItem];
  delete: [item: TableItem];
}>();

const isHovered = ref(false);
const isOrder = computed(() => props.item.type === 'order');
const itemClass = computed(() => getItemClass(props.item.type, props.item.status));
const statusLabel = computed(() =>
  isOrder.value
    ? getOrderStatusLabel(props.item.status)
    : getReservationStatusLabel(props.item.status),
);

const { hasOverflow } = useCardOverflow();

const { durationClass, isPast, itemStyle, timeText } = useCardGeometry({
  item: toRef(props, 'item'),
  timeSlot: toRef(props, 'timeSlot'),
  verticalScale: toRef(props, 'verticalScale'),
  isHovered,
  isToday: toRef(props, 'isToday'),
  currentMinutes: toRef(props, 'currentMinutes'),
  isOrder,
});

const itemHeightPx = computed(() => parseInt(String(itemStyle.value.height)) || 0);

const { fields, display, customerLine, tooltipLines } = useCardFields({
  item: toRef(props, 'item'),
  isOrder,
  statusLabel,
  timeText,
  itemHeightPx,
  hasOverflow,
});

const deleteButtonTitle = computed(() =>
  isOrder.value ? 'Удалить заказ' : 'Удалить бронирование',
);

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

  --card-title-size: 0.85rem;
  --card-title-line: 1.1;
  --card-title-mt: 0;
  --card-badge-size: 0.65rem;
  --card-badge-padding: 0.05rem 0.3rem;
  --card-badge-margin: 0;
  --card-time-size: 0.8rem;
  --card-time-line: 1.1;
  --card-time-mb: 0;
  --card-extra-size: 0.7rem;
  --card-extra-line: normal;
  --card-content-gap: 0.35rem;
  --card-content-padding: 0;
  --card-content-justify: flex-start;
}

.reservation-item.hovered {
  transform: scale(1.02);
  box-shadow: 0 6px 16px rgba(0, 0, 0);
}

.reservation-item.selected {
  border: 2px solid #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
}

.reservation-item.search-dimmed {
  opacity: 0.25;
  transition: opacity 0.2s ease;
}

.reservation-item.search-match {
  box-shadow: 0 0 0 2px var(--accent-search, #facc15), 0 6px 16px rgba(0, 0, 0, 0.35);
  z-index: 2000;
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
  gap: var(--card-content-gap);
  padding: var(--card-content-padding);
  align-items: flex-start;
  text-align: left;
  justify-content: var(--card-content-justify);
}

.item-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  font-size: var(--card-title-size);
  line-height: var(--card-title-line);
  margin: var(--card-title-mt) 0 0 0;
}

.status-badge {
  background-color: var(--badge-bg);
  color: var(--badge-color);
  padding: var(--card-badge-padding);
  margin: var(--card-badge-margin) 0;
  border-radius: 3px;
  font-size: var(--card-badge-size);
  font-weight: var(--badge-font-weight);
  box-shadow: var(--badge-shadow);
  white-space: nowrap;
}


.time-display {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  font-size: var(--card-time-size);
  line-height: var(--card-time-line);
  margin: 0 0 var(--card-time-mb) 0;
}

.hover-extra {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 2px;
}

.hover-extra.compact { gap: 4px; margin-top: 1px; }

.extra-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--card-extra-size);
  line-height: var(--card-extra-line);
  opacity: 0.95;
  margin: 0;
}

.reservation-item[data-duration="short"] {
  --card-content-padding: 2px 0;
  --card-content-justify: space-between;
  --card-title-size: 0.8rem;
  --card-title-line: 1;
  --card-title-mt: 1px;
  --card-badge-size: 0.6rem;
  --card-badge-padding: 0.03rem 0.25rem;
  --card-badge-margin: 1px;
  --card-time-size: 0.75rem;
  --card-time-line: 1;
  --card-time-mb: 1px;
}

.reservation-item[data-scale="0.5"] {
  --card-title-size: 0.8rem;
  --card-title-line: 1;
  --card-badge-size: 0.6rem;
  --card-badge-padding: 0.03rem 0.25rem;
  --card-time-size: 0.75rem;
  --card-time-line: 1;
}

.reservation-item[data-scale="0.5"][data-duration="short"] {
  --card-content-padding: 1px 0;
  --card-title-size: 0.75rem;
  --card-title-mt: 0;
  --card-badge-size: 0.55rem;
  --card-badge-padding: 0.02rem 0.2rem;
  --card-badge-margin: 0;
  --card-time-size: 0.7rem;
  --card-time-mb: 0;
}

.order-regular {
  background-color: color-mix(in srgb, var(--card-order-regular) var(--card-bg-opacity), transparent);
  border-left: var(--card-border-width) solid var(--card-order-regular);
  box-shadow: var(--card-shadow);
  min-height: 50px;
}
.order-banquet {
  background-color: color-mix(in srgb, var(--card-order-banquet) var(--card-bg-opacity), transparent);
  border-left: var(--card-border-width) solid var(--card-order-banquet);
  box-shadow: var(--card-shadow);
  min-height: 50px;
}
.order-reservation,
.reservation-regular {
  background-color: color-mix(in srgb, var(--card-reservation-regular) var(--card-bg-opacity), transparent);
  border-left: var(--card-border-width) solid var(--card-reservation-regular);
  box-shadow: var(--card-shadow);
}
.order-live-queue {
  background-color: color-mix(in srgb, var(--card-reservation-live) var(--card-bg-opacity), transparent);
  border-left: var(--card-border-width) solid var(--card-reservation-live);
  box-shadow: var(--card-shadow);
}

.reservation-item.past-item {
  background-color: var(--past-card-bg) !important;
  border-left: var(--card-border-width) solid var(--past-card-border) !important;
  color: var(--text-muted);
  box-shadow: none !important;
}


@media (max-width: 460px) {
  .reservation-item {
    font-size: 10px;
    padding: 0.25rem;
    min-height: 35px;
    border-left-width: 3px;

    --card-content-gap: 0.25rem;
    --card-content-padding: 0.25rem;
    --card-title-size: 0.75rem;
    --card-badge-size: 0.6rem;
    --card-badge-padding: 0.1rem 0.2rem;
    --card-time-size: 0.7rem;
    --card-extra-size: 0.65rem;
    --card-extra-line: 1.1;
  }
  .hover-extra { gap: 0.2rem; margin-top: 0.1rem; }

  .reservation-item[data-duration="short"] {
    --card-content-padding: 0.1rem 0;
    --card-title-size: 0.7rem;
    --card-badge-size: 0.55rem;
    --card-badge-padding: 0.05rem 0.15rem;
    --card-time-size: 0.65rem;
  }

  .reservation-item[data-scale="0.5"] {
    --card-title-size: 0.7rem;
    --card-badge-size: 0.55rem;
    --card-badge-padding: 0.05rem 0.15rem;
    --card-time-size: 0.65rem;
  }

  .reservation-item[data-scale="0.5"][data-duration="short"] {
    --card-content-padding: 0.05rem 0;
    --card-title-size: 0.65rem;
    --card-badge-size: 0.5rem;
    --card-badge-padding: 0.02rem 0.1rem;
    --card-time-size: 0.6rem;
  }

  .delete-button { width: 18px; height: 18px; font-size: 10px; right: 1px; top: 1px; }
}
</style>
