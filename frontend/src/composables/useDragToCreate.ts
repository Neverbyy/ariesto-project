import { ref, type Ref } from 'vue';
import type { Table } from '../types/reservation';

const BASE_TIME_SLOT_HEIGHT = 50;
const DIRECTION_THRESHOLD = 20;
const MINUTES_PER_SLOT = 30;

interface DragState {
  table: Table | null;
  startTimeSlot: string;
  endTimeSlot: string;
  startX: number;
  startY: number;
  selectedTables: Table[];
  isHorizontalDrag: boolean;
}

const initialState = (): DragState => ({
  table: null,
  startTimeSlot: '',
  endTimeSlot: '',
  startX: 0,
  startY: 0,
  selectedTables: [],
  isHorizontalDrag: false,
});

export interface DragCompletePayload {
  startTime: string;
  endTime: string;
  durationHours: number;
  selectedTables: Table[];
  totalCapacity: number;
}

export interface UseDragToCreateOptions {
  timeSlots: Ref<string[]>;
  filteredTables: Ref<Table[]>;
  verticalScale: Ref<number>;
  /** Должна возвращать true, если в ячейке уже есть элементы — drag отменяется. */
  isCellOccupied: (table: Table, timeSlot: string) => boolean;
  onComplete: (payload: DragCompletePayload) => void;
}

export function useDragToCreate(opts: UseDragToCreateOptions) {
  const isDragging = ref(false);
  const dragData = ref<DragState>(initialState());

  const reset = () => {
    isDragging.value = false;
    dragData.value = initialState();
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  };

  const updateDirection = (clientX: number, clientY: number) => {
    const dx = Math.abs(clientX - dragData.value.startX);
    const dy = Math.abs(clientY - dragData.value.startY);
    if (dx > dy && dx > DIRECTION_THRESHOLD) dragData.value.isHorizontalDrag = true;
    else if (dy > dx && dy > DIRECTION_THRESHOLD) dragData.value.isHorizontalDrag = false;
  };

  const updateEndTimeSlot = (clientY: number) => {
    const slotHeight = BASE_TIME_SLOT_HEIGHT * opts.verticalScale.value;
    const dragged = Math.round((clientY - dragData.value.startY) / slotHeight);
    const startIndex = opts.timeSlots.value.indexOf(dragData.value.startTimeSlot);
    if (startIndex === -1) return;

    // Только вниз: endIndex >= startIndex
    const endIndex = Math.max(
      startIndex,
      Math.min(opts.timeSlots.value.length - 1, startIndex + dragged),
    );
    dragData.value.endTimeSlot = opts.timeSlots.value[endIndex];
  };

  const handleMouseDown = (event: MouseEvent, table: Table, timeSlot: string) => {
    if (event.button !== 0) return;
    event.preventDefault();

    isDragging.value = true;
    dragData.value = {
      table,
      startTimeSlot: timeSlot,
      endTimeSlot: timeSlot,
      startX: event.clientX,
      startY: event.clientY,
      selectedTables: [table],
      isHorizontalDrag: false,
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleMouseEnter = (event: MouseEvent, table: Table, timeSlot: string) => {
    if (!isDragging.value || !dragData.value.table) return;

    // Если в ячейке уже что-то есть — прерываем drag
    if (opts.isCellOccupied(table, timeSlot)) {
      reset();
      return;
    }

    updateDirection(event.clientX, event.clientY);

    if (dragData.value.isHorizontalDrag) {
      const startIdx = opts.filteredTables.value.findIndex((t) => t.id === dragData.value.table!.id);
      const currentIdx = opts.filteredTables.value.findIndex((t) => t.id === table.id);
      if (startIdx !== -1 && currentIdx !== -1) {
        const [from, to] = [Math.min(startIdx, currentIdx), Math.max(startIdx, currentIdx)];
        dragData.value.selectedTables = opts.filteredTables.value.slice(from, to + 1);
      }
    } else {
      dragData.value.selectedTables = [dragData.value.table];
    }
  };

  const handleGlobalMouseMove = (event: MouseEvent) => {
    if (!isDragging.value) return;
    updateDirection(event.clientX, event.clientY);
    updateEndTimeSlot(event.clientY);
  };

  const handleGlobalMouseUp = () => {
    if (!isDragging.value) return;

    const { startTimeSlot, endTimeSlot, selectedTables } = dragData.value;
    const hasTimeChange = startTimeSlot !== endTimeSlot;
    const hasTableChange = selectedTables.length > 1;

    if (hasTimeChange || hasTableChange) {
      const startIndex = opts.timeSlots.value.indexOf(startTimeSlot);
      const endIndex = opts.timeSlots.value.indexOf(endTimeSlot);
      const durationHours = ((endIndex - startIndex) * MINUTES_PER_SLOT) / 60;
      const totalCapacity = selectedTables.reduce((sum, t) => sum + t.capacity, 0);

      opts.onComplete({
        startTime: startTimeSlot,
        endTime: endTimeSlot,
        durationHours,
        selectedTables,
        totalCapacity,
      });
    }

    reset();
  };

  /** В диапазоне drag? Используется для подсветки ячеек. */
  const isInDragRange = (timeSlot: string): boolean => {
    if (!isDragging.value || !dragData.value.table) return false;
    const startIndex = opts.timeSlots.value.indexOf(dragData.value.startTimeSlot);
    const endIndex = opts.timeSlots.value.indexOf(dragData.value.endTimeSlot);
    const currentIndex = opts.timeSlots.value.indexOf(timeSlot);
    if (startIndex === -1 || endIndex === -1 || currentIndex === -1) return false;
    return currentIndex >= startIndex && currentIndex <= endIndex;
  };

  const isTableSelected = (table: Table): boolean =>
    dragData.value.selectedTables.some((t) => t.id === table.id);

  return {
    isDragging,
    dragData,
    handleMouseDown,
    handleMouseEnter,
    isInDragRange,
    isTableSelected,
  };
}
