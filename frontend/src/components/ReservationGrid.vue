<template>
  <div class="grid-shell">
    <div
      v-if="isToday && labelOutsideTop !== null"
      class="current-time-label-outside"
      :style="{ top: `${labelOutsideTop}px` }"
    >
      {{ currentTime }}
    </div>

    <div class="reservation-grid-container" ref="gridContainerEl" :style="gridStyles" :aria-busy="isLoading">
      <div class="grid-wrapper">

        <div class="corner-cell"></div>

        <div class="table-headers">
          <div
            v-for="table in tables"
            :key="table.id"
            class="table-header-cell"
          >
            <div class="table-number">#{{ table.number }}</div>
            <div class="table-capacity">{{ table.capacity }} чел</div>
            <div class="table-zone">{{ table.zone }}</div>
          </div>
        </div>

        <div class="time-column">
          <div v-for="ts in timeSlots" :key="ts" class="time-cell">{{ ts }}</div>
        </div>

        <div class="grid-content" ref="gridContentEl">
          <div class="tables-columns">
            <div
              v-for="table in tables"
              :key="table.id"
              class="table-column"
              :class="{
                'dragging-horizontal':
                  drag.isDragging.value && drag.dragData.value.isHorizontalDrag && drag.isTableSelected(table),
              }"
            >
              <div
                v-for="ts in timeSlots"
                :key="ts"
                class="table-cell"
                :class="cellClasses(table, ts)"
                @mousedown="drag.handleMouseDown($event, table, ts)"
                @mouseenter="drag.handleMouseEnter($event, table, ts)"
              >
                <ReservationItem
                  v-for="item in getItemsForTableAndTime(table, ts)"
                  :key="`${table.id}-${ts}-${item.id}-${item.type}`"
                  :item="item"
                  :time-slot="ts"
                  :vertical-scale="verticalScale"
                  :is-selected="!!(selectedOrder && selectedOrder.id === item.id)"
                  :is-today="isToday"
                  :current-minutes="currentMinutes"
                  :is-search-active="isSearchActive"
                  :is-search-match="!!(isSearchActive && matchedIds?.has(item.id))"
                  @click="emit('item-click', item)"
                  @delete="emit('item-delete', item)"
                />
              </div>
            </div>
          </div>

          <div
            v-if="isToday && nowLineTop !== null"
            class="current-time-line"
            :style="{ top: `${nowLineTop}px` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { Table, TableItem } from '../types/reservation';
import ReservationItem from './ReservationItem.vue';
import { useDragToCreate, type DragCompletePayload } from '../composables/useDragToCreate';
import { getItemsForTableAndTime } from '../utils/tableItems';
import { toMinutes } from '../utils/time';
import { config } from '../config';

const { timeSlotHeight: BASE_SLOT_HEIGHT, timeSlotMinutes: MINUTES_PER_SLOT } = config.grid;

const props = defineProps<{
  tables: Table[];
  timeSlots: string[];
  horizontalScale: number;
  verticalScale: number;
  selectedOrder: TableItem | null;
  isLoading?: boolean;
  isToday: boolean;
  currentMinutes: number;
  currentTime: string;
  matchedIds?: Set<string>;
  isSearchActive?: boolean;
}>();

const emit = defineEmits<{
  'item-click': [item: TableItem];
  'item-delete': [item: TableItem];
  'drag-complete': [payload: DragCompletePayload];
}>();

const isPastSlot = (ts: string): boolean => {
  if (!props.isToday) return false;
  return toMinutes(ts) + MINUTES_PER_SLOT <= props.currentMinutes;
};

const drag = useDragToCreate({
  timeSlots: computed(() => props.timeSlots),
  filteredTables: computed(() => props.tables),
  verticalScale: computed(() => props.verticalScale),
  isCellOccupied: (table, ts) => getItemsForTableAndTime(table, ts).length > 0,
  isPastSlot,
  onComplete: (payload) => emit('drag-complete', payload),
});

const gridStyles = computed(() => ({
  '--horizontal-scale': props.horizontalScale,
  '--vertical-scale': props.verticalScale,
  '--table-column-width': `${200 * props.horizontalScale}px`,
  '--time-slot-height': `${BASE_SLOT_HEIGHT * props.verticalScale}px`,
}));

const cellClasses = (table: Table, ts: string) => ({
  dragging: drag.isDragging.value && drag.isInDragRange(ts) && drag.isTableSelected(table),
  'dragging-horizontal':
    drag.isDragging.value
    && drag.dragData.value.isHorizontalDrag
    && drag.isInDragRange(ts)
    && drag.isTableSelected(table),
  occupied: getItemsForTableAndTime(table, ts).length > 0,
  past: isPastSlot(ts),
});

const nowLineTop = computed<number | null>(() => {
  if (!props.isToday || props.timeSlots.length === 0) return null;
  const openingMinutes = toMinutes(props.timeSlots[0]);
  const lastSlotMinutes = toMinutes(props.timeSlots[props.timeSlots.length - 1]);
  const closingMinutes = lastSlotMinutes + MINUTES_PER_SLOT;
  if (props.currentMinutes < openingMinutes || props.currentMinutes >= closingMinutes) return null;
  const slotHeight = BASE_SLOT_HEIGHT * props.verticalScale;
  return ((props.currentMinutes - openingMinutes) / MINUTES_PER_SLOT) * slotHeight;
});

const gridContainerEl = ref<HTMLElement | null>(null);
const gridContentEl = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const gridContentOffsetTop = ref(0);

const updateScrollTop = () => {
  scrollTop.value = gridContainerEl.value?.scrollTop ?? 0;
};

const updateGridContentOffsetTop = () => {

  gridContentOffsetTop.value = gridContentEl.value?.offsetTop ?? 0;
};

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  gridContainerEl.value?.addEventListener('scroll', updateScrollTop, { passive: true });
  updateScrollTop();

  nextTick(updateGridContentOffsetTop);
  if (gridContainerEl.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(updateGridContentOffsetTop);
    resizeObserver.observe(gridContainerEl.value);
  }
});

onUnmounted(() => {
  gridContainerEl.value?.removeEventListener('scroll', updateScrollTop);
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch([() => props.verticalScale, () => props.timeSlots.length, () => props.tables.length],
  () => nextTick(updateGridContentOffsetTop));

const labelOutsideTop = computed<number | null>(() => {
  if (nowLineTop.value === null) return null;

  return gridContentOffsetTop.value + nowLineTop.value - scrollTop.value - 11;
});
</script>

<style scoped>
.reservation-grid-container {
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 100%;
  max-height: 80vh;
  position: relative;
  scrollbar-width: auto;
  scrollbar-color: #606060 var(--bg-secondary);

  contain: layout style;
}

.reservation-grid-container::-webkit-scrollbar { width: 12px; height: 12px; }
.reservation-grid-container::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 6px;
}
.reservation-grid-container::-webkit-scrollbar-thumb {
  background: #606060;
  border-radius: 6px;
  border: 2px solid #2a2a2a;
}
.reservation-grid-container::-webkit-scrollbar-thumb:hover { background: #707070; }
.reservation-grid-container::-webkit-scrollbar-corner { background: #2a2a2a; }

.grid-wrapper {
  display: grid;
  grid-template-columns: var(--time-col-width, 80px) minmax(max-content, 1fr);
  grid-template-rows: auto 1fr;
  width: max-content;
  min-width: 100%;
}

.corner-cell {
  grid-row: 1;
  grid-column: 1;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 850;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.table-headers {
  grid-row: 1;
  grid-column: 2;
  display: flex;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 700;
  min-width: max-content;
}

.table-header-cell {
  flex: 1;
  min-width: var(--table-column-width, 200px);
  width: var(--table-column-width, 200px);
  padding: 1rem 0.5rem;
  border-right: 1px solid #404040;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
}

.table-number { font-weight: 600; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.table-capacity { font-size: 0.9rem; color: #a0a0a0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.table-zone { font-size: 0.8rem; color: #808080; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.grid-content {
  grid-row: 2;
  grid-column: 2;
  display: flex;
  position: relative;
  z-index: 1;
}

.current-time-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--card-reservation-regular);
  box-shadow: 0 0 6px var(--card-reservation-regular);

  z-index: 800;
  pointer-events: none;
}

.grid-shell {
  position: relative;
  width: 100%;
}

.current-time-label-outside {
  position: absolute;
  right: calc(100% + 4px);
  width: 56px;
  text-align: center;
  background-color: var(--card-reservation-regular);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 3px 0;
  border-radius: 3px;
  white-space: nowrap;
  line-height: 1.2;
  z-index: 800;
  pointer-events: none;
  box-shadow: 0 0 6px var(--card-reservation-regular);
}

.time-column {
  grid-row: 2;
  grid-column: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  position: sticky;
  left: 0;
  z-index: 700;
  border-right: 1px solid var(--border-color);
}

.time-cell {
  height: var(--time-slot-height, 50px);
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tables-columns {
  display: flex;
  flex: 1;
  min-width: max-content;
  position: relative;
  z-index: 1;
}

.table-column {
  flex: 1;
  min-width: var(--table-column-width, 200px);
  width: var(--table-column-width, 200px);
  flex-shrink: 0;
}

.table-cell {
  height: var(--time-slot-height, 50px);
  border-bottom: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  position: relative;
  padding: 2px;
  overflow: visible;
  min-height: var(--time-slot-height, 50px);
  transition: all 0.2s ease;
}

.table-cell:hover:not(.occupied) {
  background-color: var(--cell-hover-bg);
  border-color: var(--cell-hover-border);
  box-shadow: inset 0 0 0 1px var(--cell-hover-shadow);
}

.table-cell.dragging {
  background-color: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
}

.table-cell.dragging-horizontal {
  background-color: rgba(16, 185, 129, 0.1) !important;
  border: 2px dashed #10b981 !important;
  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.3) !important;
}

.table-column.dragging-horizontal { background-color: rgba(16, 185, 129, 0.05); }

.table-cell.past {
  background-color: rgba(160, 160, 160, 0.08);
  cursor: not-allowed;
}
.table-cell.past:hover {
  background-color: rgba(160, 160, 160, 0.12);
  border-color: var(--border-color);
  box-shadow: none;
}

.table-cell.occupied {
  cursor: not-allowed;
  background-color: var(--cell-occupied-bg);
}
.table-cell.occupied:hover {
  background-color: var(--cell-occupied-hover-bg);
  border-color: var(--cell-occupied-hover-border);
  box-shadow: inset 0 0 0 1px var(--cell-occupied-hover-shadow);
}

@media (max-width: 460px) {
  .reservation-grid-container { margin: 1rem 0; max-height: 60vh; }
  .grid-wrapper { --time-col-width: 60px; }
  .table-header-cell { min-width: 80px; padding: 0.25rem; }
  .table-number { font-size: 12px; }
  .table-capacity { font-size: 10px; }
  .table-zone { font-size: 10px; }
  .time-cell { font-size: 12px; padding: 0.25rem; height: 40px; }
  .table-cell { min-width: 80px; height: 40px; }
  .table-cell.dragging,
  .table-cell.dragging-horizontal { border-width: 1px; }
  .table-cell.occupied { background-color: rgba(239, 68, 68, 0.08); }
  .table-cell.occupied:hover { background-color: rgba(239, 68, 68, 0.12); }
}
</style>
