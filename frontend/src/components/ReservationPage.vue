<template>
  <div class="reservation-page">
    <ReservationHeader
      :restaurant-name="restaurant?.restaurant_name"
      v-model:search-query="searchQuery"
      :is-dark-theme="isDarkTheme"
      @search="handleSearch"
      @toggle-theme="toggleTheme"
    />

    <main class="main-content">
      <div class="page-title">
        <h2>Бронирования</h2>
      </div>

      <DateSelector
        :available-days="availableDays"
        :selected-date="selectedDate"
        @select="selectDate"
      />

      <ZoneSelector
        :zones="zones"
        :selected-zones="selectedZones"
        @toggle="toggleZone"
      />

      <div class="drag-instructions">
        <div class="instruction-icon">💡</div>
        <div class="instruction-text">
          <strong>Создание заказа:</strong>
          Зажмите левую кнопку мыши на пустой ячейке и протяните вниз для выбора времени
          или вправо для выбора нескольких столов.
        </div>
      </div>

      <ReservationGrid
        :tables="filteredTables"
        :time-slots="timeSlots"
        :horizontal-scale="horizontalScale"
        :vertical-scale="verticalScale"
        :selected-order="selectedOrder"
        :is-loading="isLoading"
        :is-today="isToday"
        :current-minutes="currentMinutes"
        :current-time="currentTime"
        @item-click="handleItemClick"
        @item-delete="handleItemDelete"
        @drag-complete="openCreateModal"
      />

      <ScaleWidget @increase="increaseScale" @decrease="decreaseScale" />
    </main>

    <NewOrderModal
      v-if="dragInfo"
      :visible="showNewOrderModal"
      :selected-date="selectedDate"
      :drag-info="dragInfo"
      @close="closeNewOrderModal"
      @create="createNewOrder"
    />

    <LoadingOverlay :visible="isLoading" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TableItem } from '../types/reservation';
import {
  useReservationsByDate,
  useSearchReservations,
  useCreateOrder,
  useDeleteOrder,
} from '../queries/reservations';
import { useTheme } from '../composables/useTheme';
import { useSelectedZones } from '../composables/useSelectedZones';
import { useScale } from '../composables/useScale';
import { useTimeSlots } from '../composables/useTimeSlots';
import { useCurrentTime } from '../composables/useCurrentTime';
import { todayISO } from '../utils/time';
import ReservationHeader from './ReservationHeader.vue';
import DateSelector from './DateSelector.vue';
import ZoneSelector from './ZoneSelector.vue';
import ReservationGrid from './ReservationGrid.vue';
import ScaleWidget from './ScaleWidget.vue';
import NewOrderModal, { type DragInfo, type CreateOrderPayload } from './NewOrderModal.vue';
import LoadingOverlay from './LoadingOverlay.vue';

const zones: string[] = ['1 этаж', '2 этаж', 'Банкетный зал'];

const selectedDate = ref<string>(todayISO());
const searchQuery = ref<string>('');
const submittedSearch = ref<string>('');
const selectedOrder = ref<TableItem | null>(null);

const { isDarkTheme, toggleTheme } = useTheme();
const { selectedZones, toggleZone } = useSelectedZones(zones, ['1 этаж', '2 этаж']);
const { horizontalScale, verticalScale, increaseScale, decreaseScale } = useScale();
const { currentTime, currentMinutes } = useCurrentTime();
const isToday = computed(() => selectedDate.value === todayISO());

// Запросы Vue Query
const reservationsQuery = useReservationsByDate(selectedDate);
const searchQueryResult = useSearchReservations(submittedSearch);
const createOrderMutation = useCreateOrder(selectedDate);
const deleteOrderMutation = useDeleteOrder(selectedDate);

// Источник данных: поиск, если активен, иначе по дате
const reservationData = computed(() =>
  submittedSearch.value.trim()
    ? searchQueryResult.data.value ?? null
    : reservationsQuery.data.value ?? null,
);

const isLoading = computed(() =>
  reservationsQuery.isFetching.value
  || searchQueryResult.isFetching.value
  || createOrderMutation.isPending.value
  || deleteOrderMutation.isPending.value,
);

const restaurant = computed(() => reservationData.value?.restaurant);
const availableDays = computed(() => reservationData.value?.available_days ?? []);
const tables = computed(() => reservationData.value?.tables ?? []);
const filteredTables = computed(() =>
  tables.value.filter((table) => selectedZones.value.includes(table.zone)),
);
const timeSlots = useTimeSlots(restaurant);

// --- Модалка создания заказа ---

const showNewOrderModal = ref(false);
const dragInfo = ref<DragInfo | null>(null);

const openCreateModal = (payload: DragInfo) => {
  dragInfo.value = payload;
  showNewOrderModal.value = true;
};

const closeNewOrderModal = () => {
  showNewOrderModal.value = false;
  dragInfo.value = null;
};

const createNewOrder = (payload: CreateOrderPayload) => {
  if (!dragInfo.value) return;
  const order = {
    start_time: `${selectedDate.value}T${dragInfo.value.startTime}:00+10:00`,
    end_time: `${selectedDate.value}T${dragInfo.value.endTime}:00+10:00`,
    customer_name: payload.customerName,
    customer_phone: payload.customerPhone,
    num_people: payload.numPeople,
    status: payload.status,
    tables: dragInfo.value.selectedTables.map((t) => t.id),
  };
  createOrderMutation.mutate(order, { onSuccess: closeNewOrderModal });
};

// --- Прочие обработчики ---

const selectDate = (date: string) => {
  // Сбрасываем поиск, чтобы вернуться к виду по дате
  submittedSearch.value = '';
  searchQuery.value = '';
  selectedDate.value = date;
};

const handleSearch = () => {
  // Пустая строка отключит запрос поиска и вернёт вид по дате
  submittedSearch.value = searchQuery.value.trim();
};

const handleItemClick = (item: TableItem) => {
  selectedOrder.value = selectedOrder.value?.id === item.id ? null : item;
};

const handleItemDelete = (item: TableItem) => {
  selectedOrder.value = null;
  deleteOrderMutation.mutate(item);
};
</script>

<style scoped>
.reservation-page {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  width: 100%;
  max-width: 100%;
}

.main-content {
  padding: 2rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.page-title h2 {
  text-align: left;
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 2rem 0;
  width: 100%;
}

.drag-instructions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  width: 100%;
  box-sizing: border-box;
}

.instruction-icon { font-size: 1.5rem; flex-shrink: 0; }
.instruction-text { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.4; }
.instruction-text strong { color: var(--text-primary); }

@media (max-width: 460px) {
  .reservation-page { min-width: 280px; }
  .main-content { padding: 1rem 0.5rem; }
  .page-title h2 { font-size: 1.5rem; margin-bottom: 1rem; }
  .drag-instructions { padding: 0.75rem; margin: 1rem 0; }
  .instruction-text { font-size: 12px; line-height: 1.4; }
}
</style>
