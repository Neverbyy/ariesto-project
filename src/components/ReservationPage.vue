<template>
  <div class="reservation-page">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <h1 class="brand">AIRESTO | {{ restaurant?.restaurant_name || 'Супра' }}</h1>
      </div>
      <div class="header-right">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Q +Л поиск по имени"
            @keyup.enter="handleSearch"
          />
        </div>
        <button class="theme-toggle" @click="toggleTheme">
          {{ isDarkTheme ? '☀️' : '🌙' }}
        </button>
        <button class="exit-btn">
          <span>Выйти</span>
          <span class="arrow">→</span>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <div class="page-title">
        <h2>Бронирования</h2>
      </div>

      <!-- Date Selection -->
      <div class="date-section">
        <label>Дата</label>
                 <div class="date-buttons">
           <button
             v-for="day in availableDays"
             :key="day"
             :class="['date-btn', { active: selectedDate === day }]"
             @click="selectDate(day)"
           >
             <div class="date-day">{{ formatDate(day).day }} {{ formatDate(day).month }}</div>
             <div class="date-label">{{ formatDate(day).label }}</div>
           </button>
         </div>
      </div>

      <!-- Zone Selection -->
      <div class="zone-section">
        <label>Отображаемые зоны</label>
        <div class="zone-buttons">
          <button
            v-for="zone in zones"
            :key="zone"
            :class="['zone-btn', { active: selectedZones.includes(zone) }]"
            @click="toggleZone(zone)"
          >
            {{ zone }}
          </button>
        </div>
      </div>

             <!-- Instructions -->
       <div class="drag-instructions">
         <div class="instruction-icon">💡</div>
         <div class="instruction-text">
           <strong>Создание заказа:</strong> Зажмите левую кнопку мыши на пустой ячейке и протяните вниз для выбора времени или вправо для выбора нескольких столов.
         </div>
       </div>

      <!-- Reservation Grid -->
      <div class="reservation-grid-container" :style="gridStyles">
        <div class="grid-wrapper">
          <!-- Fixed table headers -->
          <div class="table-headers">
            <div class="time-header-cell"></div>
            <div
              v-for="table in filteredTables"
              :key="table.id"
              class="table-header-cell"
            >
              <div class="table-number">#{{ table.number }}</div>
              <div class="table-capacity">{{ table.capacity }} чел</div>
              <div class="table-zone">{{ table.zone }}</div>
            </div>
          </div>

          <!-- Grid content -->
          <div class="grid-content">
            <div class="time-column">
              <div
                v-for="timeSlot in timeSlots"
                :key="timeSlot"
                class="time-cell"
              >
                {{ timeSlot }}
              </div>
            </div>
            
            <div class="tables-columns">
              <div
                v-for="table in filteredTables"
                :key="table.id"
                class="table-column"
                :class="{ 'dragging-horizontal': isDragging && dragData.isHorizontalDrag && dragData.selectedTables.some(t => t.id === table.id) }"
              >
                                 <div
                   v-for="timeSlot in timeSlots"
                   :key="timeSlot"
                   class="table-cell"
                   @mousedown="handleMouseDown($event, table, timeSlot)"
                   @mouseenter="handleMouseEnter($event, table, timeSlot)"
                   @mouseup="handleMouseUp"
                   :class="{ 
                     'dragging': isDragging && isInDragRange(timeSlot) && isTableSelected(table),
                     'dragging-horizontal': isDragging && dragData.isHorizontalDrag && isInDragRange(timeSlot) && isTableSelected(table),
                     'occupied': getItemsForTableAndTime(table, timeSlot).length > 0
                   }"
                 >
                  <ReservationItem
                    v-for="item in getItemsForTableAndTime(table, timeSlot)"
                    :key="`${table.id}-${timeSlot}-${item.id}-${item.type}`"
                    :item="item"
                    :time-slot="timeSlot"
                    :vertical-scale="verticalScale"
                    :is-selected="selectedOrder && selectedOrder.id === item.id"
                    @click="handleItemClick"
                    @delete="handleItemDelete"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Fixed Scale Widget -->
      <div class="fixed-scale-widget">
        <div class="scale-label">Масштаб</div>
        <div class="scale-buttons">
          <button class="scale-btn scale-decrease" @click="decreaseScale">-</button>
          <button class="scale-btn scale-increase" @click="increaseScale">+</button>
        </div>
      </div>
    </main>

    <!-- New Order Modal -->
    <div v-if="showNewOrderModal" class="modal-overlay" @click="closeNewOrderModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Новый заказ</h3>
          <button class="modal-close" @click="closeNewOrderModal">×</button>
        </div>
        <div class="modal-body">
          <div class="order-details">
            <div class="detail-row">
              <span class="detail-label">Дата:</span>
              <span class="detail-value">{{ formatDateForModal(selectedDate) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Время:</span>
              <span class="detail-value">{{ newOrderData.startTime }} – {{ newOrderData.endTime }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Длительность:</span>
              <span class="detail-value">{{ newOrderData.duration }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Столы:</span>
              <span class="detail-value">{{ newOrderData.selectedTables.map(t => `#${t.number}`).join(', ') }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Количество столов:</span>
              <span class="detail-value">{{ newOrderData.selectedTables.length }} {{ newOrderData.selectedTables.length === 1 ? 'стол' : newOrderData.selectedTables.length < 5 ? 'стола' : 'столов' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Общая вместимость:</span>
              <span class="detail-value">{{ newOrderData.totalCapacity }} чел</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="orderName">Имя клиента:</label>
            <input 
              id="orderName"
              v-model="newOrderData.customerName" 
              type="text" 
              placeholder="Введите имя клиента"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="orderPhone">Телефон:</label>
            <input 
              id="orderPhone"
              v-model="newOrderData.customerPhone" 
              type="tel" 
              placeholder="+7 (999) 123-45-67"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="orderPeople">Количество человек:</label>
            <input 
              id="orderPeople"
              v-model="newOrderData.numPeople" 
              type="number" 
              min="1"
              :max="newOrderData.totalCapacity"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="orderStatus">Статус:</label>
            <select id="orderStatus" v-model="newOrderData.status" class="form-select">
              <option value="New">Новый</option>
              <option value="Bill">Счет</option>
              <option value="Closed">Закрыт</option>
              <option value="Banquet">Банкет</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeNewOrderModal">Отменить</button>
          <button class="btn btn-primary" @click="createNewOrder" :disabled="!canCreateOrder">
            Создать заказ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { ReservationData, Table, ZoneType } from '../types/reservation';
import { reservationApi } from '../services/api';
import ReservationItem from './ReservationItem.vue';

// Reactive data
const reservationData = ref<ReservationData | null>(null);
const selectedDate = ref<string>('');
const selectedZones = ref<ZoneType[]>([]);
const searchQuery = ref<string>('');

// Scale state
const horizontalScale = ref(0.5); // Base scale for horizontal (table columns) - most zoomed out
const verticalScale = ref(0.5);   // Base scale for vertical (time slots) - most zoomed out

// Theme state
const isDarkTheme = ref(true); // Default to dark theme

// Drag state for creating new orders
const isDragging = ref(false);
const dragData = ref<{
  table: Table | null;
  startTimeSlot: string;
  endTimeSlot: string;
  startY: number;
  currentY: number;
  startX: number;
  currentX: number;
  selectedTables: Table[];
  isHorizontalDrag: boolean;
}>({
  table: null,
  startTimeSlot: '',
  endTimeSlot: '',
  startY: 0,
  currentY: 0,
  startX: 0,
  currentX: 0,
  selectedTables: [],
  isHorizontalDrag: false
});

// Modal state for new order
const showNewOrderModal = ref(false);
const newOrderData = ref<{
  startTime: string;
  endTime: string;
  duration: string;
  selectedTables: Table[];
  totalCapacity: number;
  customerName: string;
  customerPhone: string;
  numPeople: number;
  status: string;
}>({
  startTime: '',
  endTime: '',
  duration: '',
  selectedTables: [],
  totalCapacity: 0,
  customerName: '',
  customerPhone: '',
  numPeople: 1,
  status: 'New'
});

// Selected item for deletion (orders, reservations, live queue)
const selectedOrder = ref<any>(null);

// Computed properties
const restaurant = computed(() => reservationData.value?.restaurant);
const availableDays = computed(() => {
  // Используем только данные от API
  if (reservationData.value?.available_days && reservationData.value.available_days.length > 0) {
    return reservationData.value.available_days;
  }
  
  // Если нет данных от API, возвращаем пустой массив
  return [];
});
const tables = computed(() => reservationData.value?.tables || []);

const zones: ZoneType[] = ['1 этаж', '2 этаж', 'Банкетный зал'];

// Функции для работы с localStorage
const saveSelectedZones = (zones: ZoneType[]) => {
  try {
    localStorage.setItem('selectedZones', JSON.stringify(zones));
  } catch (error) {
    console.error('Error saving selected zones to localStorage:', error);
  }
};

const loadSelectedZones = (): ZoneType[] => {
  try {
    const saved = localStorage.getItem('selectedZones');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Проверяем, что загруженные зоны существуют в списке доступных зон
      return parsed.filter((zone: ZoneType) => zones.includes(zone));
    }
  } catch (error) {
    console.error('Error loading selected zones from localStorage:', error);
  }
  // Возвращаем значения по умолчанию, если ничего не сохранено или произошла ошибка
  return ['1 этаж', '2 этаж'];
};

// Функции для работы с темой
const saveTheme = (isDark: boolean) => {
  try {
    localStorage.setItem('isDarkTheme', JSON.stringify(isDark));
  } catch (error) {
    console.error('Error saving theme to localStorage:', error);
  }
};

const loadTheme = (): boolean => {
  try {
    const saved = localStorage.getItem('isDarkTheme');
    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading theme from localStorage:', error);
  }
  return true; // Default to dark theme
};

const filteredTables = computed(() => {
  return tables.value.filter(table => selectedZones.value.includes(table.zone));
});

// Computed styles for scaling
const gridStyles = computed(() => ({
  '--horizontal-scale': horizontalScale.value,
  '--vertical-scale': verticalScale.value,
  '--table-column-width': `${200 * horizontalScale.value}px`, // Base table width (16px steps)
  '--time-slot-height': `${50 * verticalScale.value}px`,     // Base time slot height (4px steps)
}));

const timeSlots = computed(() => {
  if (!restaurant.value) return [];
  
  const slots: string[] = [];
  const start = restaurant.value.opening_time;
  const end = restaurant.value.closing_time;
  
  let currentTime = new Date(`2000-01-01T${start}`);
  const endTime = new Date(`2000-01-01T${end}`);
  
  while (currentTime <= endTime) {
    slots.push(currentTime.toTimeString().slice(0, 5));
    currentTime.setMinutes(currentTime.getMinutes() + 30);
  }
  
  return slots;
});

// Methods
const fetchReservationData = async (date: string) => {
  try {
    console.log(`Fetching data for date: ${date}`);
    const data = await reservationApi.getReservations(date);
    reservationData.value = data;
  } catch (error) {
    console.error('Error fetching reservation data:', error);
    throw error;
  }
};



const selectDate = (date: string) => {
  selectedDate.value = date;
  fetchReservationData(date);
};

const toggleZone = (zone: ZoneType) => {
  const index = selectedZones.value.indexOf(zone);
  if (index > -1) {
    selectedZones.value.splice(index, 1);
  } else {
    selectedZones.value.push(zone);
  }
  // Сохраняем состояние в localStorage
  saveSelectedZones(selectedZones.value);
};

const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    try {
      console.log(`Searching for: ${searchQuery.value}`);
      const data = await reservationApi.searchReservations(searchQuery.value);
      console.log('Search results:', data);
      reservationData.value = data;
    } catch (error) {
      console.error('Error searching reservations:', error);
      // Fallback to current date data on search error
      fetchReservationData(selectedDate.value);
    }
  } else {
    // If search is empty, fetch current date data
    fetchReservationData(selectedDate.value);
  }
};

const handleItemClick = (item: any) => {
  // Select any item for deletion (orders, reservations, live queue)
  if (selectedOrder.value && selectedOrder.value.id === item.id) {
    // If clicking the same item, deselect it
    selectedOrder.value = null;
  } else {
    // Select the clicked item
    selectedOrder.value = item;
  }
};

const handleItemDelete = async (item: any) => {
  try {
    const itemType = item.type === 'order' ? 'заказ' : 
                     item.status === 'Живая очередь' ? 'запись из живой очереди' : 'бронирование';
    
    console.log(`Deleting ${itemType}:`, item);
    
    // Call appropriate API method based on item type
    if (item.type === 'order') {
      await reservationApi.deleteOrder(item.id);
    } else {
      // For reservations and live queue, we'll use the same deleteOrder endpoint for now
      // In a real application, you might have separate endpoints for different types
      await reservationApi.deleteOrder(item.id);
    }
    
    // Clear selection
    selectedOrder.value = null;
    
    // Refresh the current date data to show the updated state
    await fetchReservationData(selectedDate.value);
    
    // Show success message
    alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} успешно удален!`);
    
  } catch (error) {
    console.error('Error deleting item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    const itemType = item.type === 'order' ? 'заказ' : 
                     item.status === 'Живая очередь' ? 'запись из живой очереди' : 'бронирование';
    alert(`Ошибка при удалении ${itemType}: ${errorMessage}`);
  }
};

// Drag-to-create methods
const handleMouseDown = (event: MouseEvent, table: Table, timeSlot: string) => {
  if (event.button !== 0) return; // Only left mouse button
  
  // Check if there are existing items in this cell
  const existingItems = getItemsForTableAndTime(table, timeSlot);
  
  isDragging.value = true;
  dragData.value = {
    table,
    startTimeSlot: timeSlot,
    endTimeSlot: timeSlot,
    startY: event.clientY,
    currentY: event.clientY,
    startX: event.clientX,
    currentX: event.clientX,
    selectedTables: [table],
    isHorizontalDrag: false
  };
  
  // Prevent text selection during drag
  event.preventDefault();
  
  // Add global mouse event listeners
  document.addEventListener('mousemove', handleGlobalMouseMove);
  document.addEventListener('mouseup', handleGlobalMouseUp);
};

const handleMouseEnter = (event: MouseEvent, table: Table, timeSlot: string) => {
  if (!isDragging.value || !dragData.value.table) return;
  
  // Check if there are existing items in this cell - if so, stop the drag
  const existingItems = getItemsForTableAndTime(table, timeSlot);
  if (existingItems.length > 0) {
    console.log('Drag stopped due to existing items in cell:', existingItems);
    // Reset drag state
    isDragging.value = false;
    dragData.value = {
      table: null,
      startTimeSlot: '',
      endTimeSlot: '',
      startY: 0,
      currentY: 0,
      startX: 0,
      currentX: 0,
      selectedTables: [],
      isHorizontalDrag: false
    };
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
    return;
  }
  
  // Update current position
  dragData.value.currentY = event.clientY;
  dragData.value.currentX = event.clientX;
  
  // Determine if it's a horizontal or vertical drag
  const dragDistanceY = Math.abs(event.clientY - dragData.value.startY);
  const dragDistanceX = Math.abs(event.clientX - dragData.value.startX);
  
  // If horizontal drag is detected, set isHorizontalDrag to true
  if (dragDistanceX > dragDistanceY && dragDistanceX > 20) { // Add threshold for horizontal detection
    dragData.value.isHorizontalDrag = true;
  } else if (dragDistanceY > dragDistanceX && dragDistanceY > 20) { // Add threshold for vertical detection
    dragData.value.isHorizontalDrag = false;
  }
  
  // Update selected tables based on current cursor position
  if (dragData.value.isHorizontalDrag) {
    const startTableIndex = filteredTables.value.findIndex(t => t.id === dragData.value.table!.id);
    const currentTableIndex = filteredTables.value.findIndex(t => t.id === table.id);
    
    if (startTableIndex !== -1 && currentTableIndex !== -1) {
      const minTableIndex = Math.min(startTableIndex, currentTableIndex);
      const maxTableIndex = Math.max(startTableIndex, currentTableIndex);
      
      // Only include tables that are actually under the cursor path
      dragData.value.selectedTables = filteredTables.value.slice(minTableIndex, maxTableIndex + 1);
    }
  } else {
    // For vertical drag, only select the starting table
    if (dragData.value.table) {
      dragData.value.selectedTables = [dragData.value.table];
    }
  }
};

const handleGlobalMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return;
  
  dragData.value.currentY = event.clientY;
  dragData.value.currentX = event.clientX;
  
  // Determine if it's a horizontal or vertical drag
  const dragDistanceY = Math.abs(event.clientY - dragData.value.startY);
  const dragDistanceX = Math.abs(event.clientX - dragData.value.startX);
  
  // If horizontal drag is detected, set isHorizontalDrag to true
  if (dragDistanceX > dragDistanceY && dragDistanceX > 20) { // Add threshold for horizontal detection
    dragData.value.isHorizontalDrag = true;
  } else if (dragDistanceY > dragDistanceX && dragDistanceY > 20) { // Add threshold for vertical detection
    dragData.value.isHorizontalDrag = false;
  }
  
  // Always calculate time range based on vertical drag (time is vertical)
  // Only allow dragging down (from top to bottom)
  const timeSlotHeight = 50 * verticalScale.value; // Use CSS variable
  const dragDistance = event.clientY - dragData.value.startY;
  const timeSlotsDragged = Math.round(dragDistance / timeSlotHeight);
  
  const startIndex = timeSlots.value.indexOf(dragData.value.startTimeSlot);
  if (startIndex !== -1) {
    // Only allow dragging down - endIndex should be >= startIndex
    const endIndex = Math.max(startIndex, Math.min(timeSlots.value.length - 1, startIndex + timeSlotsDragged));
    dragData.value.endTimeSlot = timeSlots.value[endIndex];
  }
  
  // Table selection is handled by handleMouseEnter based on cursor position
  // No need to update selectedTables here
};

const handleGlobalMouseUp = () => {
  if (!isDragging.value) return;
  
  // Calculate final time range
  const startTime = dragData.value.startTimeSlot;
  const endTime = dragData.value.endTimeSlot;
  const hasTimeChange = startTime !== endTime;
  const hasTableChange = dragData.value.selectedTables.length > 1;
  
  // Show modal if there are changes in time OR tables
  if (hasTimeChange || hasTableChange) {
    // Calculate duration
    const startIndex = timeSlots.value.indexOf(startTime);
    const endIndex = timeSlots.value.indexOf(endTime);
    // Правильный расчет: разница между индексами * 30 минут
    const durationMinutes = (endIndex - startIndex) * 30;
    const durationHours = durationMinutes / 60;
    
    // Отладочная информация для проверки расчета
    console.log('Duration calculation:', {
      startTime,
      endTime,
      startIndex,
      endIndex,
      durationMinutes,
      durationHours
    });
    
    // Calculate total capacity
    const totalCapacity = dragData.value.selectedTables.reduce((sum, table) => sum + table.capacity, 0);
    
    // Prepare modal data
    newOrderData.value = {
      startTime,
      endTime,
      duration: `${durationHours} ${durationHours === 1 ? 'час' : durationHours < 5 ? 'часа' : 'часов'}`,
      selectedTables: dragData.value.selectedTables,
      totalCapacity,
      customerName: '',
      customerPhone: '',
      numPeople: Math.min(totalCapacity, 1),
      status: 'New'
    };
    
    // Show modal
    showNewOrderModal.value = true;
  }
  
  // Reset drag state
  isDragging.value = false;
  dragData.value = {
    table: null,
    startTimeSlot: '',
    endTimeSlot: '',
    startY: 0,
    currentY: 0,
    startX: 0,
    currentX: 0,
    selectedTables: [],
    isHorizontalDrag: false
  };
  
  // Remove global event listeners
  document.removeEventListener('mousemove', handleGlobalMouseMove);
  document.removeEventListener('mouseup', handleGlobalMouseUp);
};

const handleMouseUp = () => {
  // This will be handled by the global mouse up handler
};

const isInDragRange = (timeSlot: string) => {
  if (!isDragging.value || !dragData.value.table) return false;
  
  const startIndex = timeSlots.value.indexOf(dragData.value.startTimeSlot);
  const endIndex = timeSlots.value.indexOf(dragData.value.endTimeSlot);
  const currentIndex = timeSlots.value.indexOf(timeSlot);
  
  if (startIndex === -1 || endIndex === -1 || currentIndex === -1) return false;
  
  // Since we only allow dragging down, startIndex should always be <= endIndex
  return currentIndex >= startIndex && currentIndex <= endIndex;
};

const isTableSelected = (table: Table) => {
  return dragData.value.selectedTables.some(selectedTable => selectedTable.id === table.id);
};

// Modal methods
const closeNewOrderModal = () => {
  showNewOrderModal.value = false;
  // Reset form data
  newOrderData.value = {
    startTime: '',
    endTime: '',
    duration: '',
    selectedTables: [],
    totalCapacity: 0,
    customerName: '',
    customerPhone: '',
    numPeople: 1,
    status: 'New'
  };
};

const formatDateForModal = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = getMonthName(date.getMonth());
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const canCreateOrder = computed(() => {
  return newOrderData.value.customerName.trim() !== '' && 
         newOrderData.value.customerPhone.trim() !== '' &&
         newOrderData.value.numPeople > 0 &&
         newOrderData.value.numPeople <= newOrderData.value.totalCapacity;
});

const createNewOrder = async () => {
  try {
    // Create one order for all selected tables
    const order = {
      start_time: `${selectedDate.value}T${newOrderData.value.startTime}:00+10:00`,
      end_time: `${selectedDate.value}T${newOrderData.value.endTime}:00+10:00`,
      customer_name: newOrderData.value.customerName,
      customer_phone: newOrderData.value.customerPhone,
      num_people: newOrderData.value.numPeople,
      status: newOrderData.value.status,
      tables: newOrderData.value.selectedTables.map(t => t.id) // All selected tables in one order
    };
    
    // Send order to server
    const result = await reservationApi.createOrder(order);
    console.log('Order created successfully:', result);
    
    // Close modal
    closeNewOrderModal();
    
    // Refresh the current date data to show the new order
    await fetchReservationData(selectedDate.value);
    
    // Show success message
    const tableCount = newOrderData.value.selectedTables.length;
    const tableText = tableCount === 1 ? 'стол' : tableCount < 5 ? 'стола' : 'столов';
    alert(`Заказ успешно создан для ${tableCount} ${tableText}!`);
    
  } catch (error) {
    console.error('Error creating order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    alert(`Ошибка при создании заказа: ${errorMessage}`);
  }
};

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
  saveTheme(isDarkTheme.value);
  
  // Синхронизируем тему с родительским компонентом
  document.body.classList.toggle('light-theme', !isDarkTheme.value);
  document.documentElement.classList.toggle('light-theme', !isDarkTheme.value);
};

// Scale functions
const increaseScale = () => {
  horizontalScale.value = Math.min(horizontalScale.value + 0.08, 3); // Max 300% (16px step)
  verticalScale.value = Math.min(verticalScale.value + 0.08, 3);     // Max 300% (4px step)
};

const decreaseScale = () => {
  horizontalScale.value = Math.max(horizontalScale.value - 0.08, 0.5); // Min 50% (16px step)
  verticalScale.value = Math.max(verticalScale.value - 0.08, 0.5);     // Min 50% (4px step)
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  
  // Сравниваем только даты (без времени)
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return {
      day: date.getDate(),
      month: getMonthName(date.getMonth()),
      label: 'сегодня'
    };
  } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return {
      day: date.getDate(),
      month: getMonthName(date.getMonth()),
      label: 'завтра'
    };
  } else {
    return {
      day: date.getDate(),
      month: getMonthName(date.getMonth()),
      label: dayNames[date.getDay()]
    };
  }
};

const getMonthName = (month: number) => {
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return months[month];
};



// Helper function to extract time from ISO string without timezone issues
const extractTimeFromISO = (isoString: string): string => {
  // Extract time part from ISO string (HH:MM:SS)
  const timeMatch = isoString.match(/T(\d{2}:\d{2}):\d{2}/);
  return timeMatch ? timeMatch[1] : '';
};

// Debug function to log table data only once
const logTableData = (table: Table) => {
  
};

// Helper function to check if two time ranges overlap
const doTimeRangesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const start1Minutes = parseInt(start1.split(':')[0]) * 60 + parseInt(start1.split(':')[1]);
  const end1Minutes = parseInt(end1.split(':')[0]) * 60 + parseInt(end1.split(':')[1]);
  const start2Minutes = parseInt(start2.split(':')[0]) * 60 + parseInt(start2.split(':')[1]);
  const end2Minutes = parseInt(end2.split(':')[0]) * 60 + parseInt(end2.split(':')[1]);
  
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
};

const getItemsForTableAndTime = (table: Table, timeSlot: string) => {
  const items: Array<any> = [];
  const seenIds = new Set();
  
  // Collect all items (orders and reservations) for this table
  const allItems: Array<any> = [];
  
  // Add orders
  table.orders.forEach(order => {
    const startTime = extractTimeFromISO(order.start_time);
    const endTime = extractTimeFromISO(order.end_time);
    
    allItems.push({
      ...order,
      type: 'order',
      startTime,
      endTime
    });
  });
  
  // Add reservations
  table.reservations.forEach(reservation => {
    const startTime = extractTimeFromISO(reservation.seating_time);
    const endTime = extractTimeFromISO(reservation.end_time);
    
    allItems.push({
      ...reservation,
      type: 'reservation',
      startTime,
      endTime
    });
  });
  
  // Calculate overlap indices for ALL items first (global calculation)
  const itemsWithOverlap = allItems.map(item => {
    // Find all items that overlap with this one (any type)
    const overlappingItems = allItems.filter(otherItem => {
      if (otherItem.id === item.id && otherItem.type === item.type) {
        return false; // Skip self
      }
      return doTimeRangesOverlap(item.startTime, item.endTime, otherItem.startTime, otherItem.endTime);
    });
    
    // Assign overlap index based on priority and position
    let overlapIndex = 0;
    if (overlappingItems.length > 0) {
      // Sort overlapping items by start time first, then by type priority
      const allOverlapping = [item, ...overlappingItems].sort((a, b) => {
        // First sort by start time (earlier items get lower overlapIndex)
        const aMinutes = parseInt(a.startTime.split(':')[0]) * 60 + parseInt(a.startTime.split(':')[1]);
        const bMinutes = parseInt(b.startTime.split(':')[0]) * 60 + parseInt(b.startTime.split(':')[1]);
        if (aMinutes !== bMinutes) {
          return aMinutes - bMinutes;
        }
        
        // If start times are equal, then use type priority: orders > live queue > other reservations
        if (a.type !== b.type) {
          if (a.type === 'order') return -1;
          if (b.type === 'order') return 1;
        }
        // Within reservations, live queue has priority
        if (a.type === 'reservation' && b.type === 'reservation') {
          if (a.status === 'Живая очередь' && b.status !== 'Живая очередь') return -1;
          if (a.status !== 'Живая очередь' && b.status === 'Живая очередь') return 1;
        }
        return 0;
      });
      
      // Find position of current item in sorted overlapping group
      overlapIndex = allOverlapping.findIndex(overlappingItem => 
        overlappingItem.id === item.id && overlappingItem.type === item.type
      );
    }
    
    return {
      ...item,
      overlapIndex: overlapIndex
    };
  });
  
  // Filter items that should be displayed in this time slot
  itemsWithOverlap.forEach(item => {
    const itemKey = `${item.id}-${item.type}`;
    
    if (!seenIds.has(itemKey)) {
      seenIds.add(itemKey);
      
      // Check if this item should be shown in this time slot
      let shouldShow = false;
      
      if (item.type === 'order') {
        // Для заказов показываем только в слоте начала, но с высотой, покрывающей все слоты
        shouldShow = item.startTime === timeSlot;
      } else {
        // Для бронирований показываем только в слоте начала
        shouldShow = item.startTime === timeSlot;
      }
      
      if (shouldShow) {
        items.push(item);
      }
    }
  });
  
  return items;
};



// Lifecycle
onMounted(() => {
  // Загружаем сохраненные зоны
  selectedZones.value = loadSelectedZones();
  
  // Загружаем сохраненную тему
  isDarkTheme.value = loadTheme();
  
  // Синхронизируем тему с родительским компонентом
  document.body.classList.toggle('light-theme', !isDarkTheme.value);
  document.documentElement.classList.toggle('light-theme', !isDarkTheme.value);
  
  const today = new Date().toISOString().split('T')[0];
  selectedDate.value = today;
  
  fetchReservationData(today);
});
</script>

<style scoped>
.reservation-page {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  width: 100%;
  max-width: 100%;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  width: 100%;
  max-width: 100%;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.header-left .brand {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: var(--bg-tertiary);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  transition: background-color 0.3s ease;
}

.search-icon {
  margin-right: 0.5rem;
}

.search-bar input {
  background: none;
  border: none;
  color: #ffffff;
  outline: none;
  width: 200px;
}

.search-bar input::placeholder {
  color: #a0a0a0;
}

.theme-toggle {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
}

.exit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--bg-tertiary);
  border: none;
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.arrow {
  font-size: 0.8rem;
}

/* Main Content */
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

/* Date and Zone Sections */
.date-section,
.zone-section {
  margin-bottom: 2rem;
  width: 100%;
}

.date-section label,
.zone-section label {
  display: block;
  text-align: left;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

/* Drag Instructions */
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

.instruction-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.instruction-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
}

.instruction-text strong {
  color: var(--text-primary);
}

.date-buttons,
.zone-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  width: 100%;
}

.date-btn,
.zone-btn {
  background-color: var(--bg-tertiary);
  border: none;
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 18px;
}

.date-btn:hover,
.zone-btn:hover {
  background-color: #505050;
}

.date-btn.active,
.zone-btn.active {
  background-color: var(--accent-color);
  color: #ffffff;
}

.date-btn.active .date-label {
  color: #ffffff;
}

.date-day {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 2px;
}

.date-label {
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--text-muted);
  line-height: 1;
  text-transform: lowercase;
  text-align: left;
  transition: color 0.3s ease;
}

/* Reservation Grid */
.reservation-grid-container {
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 100%;
  max-height: 80vh;
  position: relative;
  transition: border-color 0.3s ease;
  
  /* Custom scrollbar styles */
  scrollbar-width: auto;
  scrollbar-color: #606060 var(--bg-secondary);
}

/* Webkit scrollbar styles (Chrome, Safari, Edge) */
.reservation-grid-container::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.reservation-grid-container::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 6px;
}

.reservation-grid-container::-webkit-scrollbar-thumb {
  background: #606060;
  border-radius: 6px;
  border: 2px solid #2a2a2a;
}

.reservation-grid-container::-webkit-scrollbar-thumb:hover {
  background: #707070;
}

.reservation-grid-container::-webkit-scrollbar-corner {
  background: #2a2a2a;
}

.grid-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.table-headers {
  display: flex;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 2100;
  min-width: max-content;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.time-header-cell {
  width: 80px;
  min-width: 80px;
  padding: 1rem 0.5rem;
  border-right: 1px solid #404040;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
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

.table-number {
  font-weight: 600;
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-capacity {
  font-size: 0.9rem;
  color: #a0a0a0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-zone {
  font-size: 0.8rem;
  color: #808080;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grid-content {
  display: flex;
}

.time-column {
  width: 80px;
  min-width: 80px;
  background-color: var(--bg-secondary);
  position: sticky;
  left: 0;
  z-index: 2100;
  transition: background-color 0.3s ease;
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
  transition: border-color 0.3s ease, color 0.3s ease;
}

.tables-columns {
  display: flex;
  flex: 1;
  min-width: max-content;
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

/* Hover effect for interactive cells */
.table-cell:hover:not(.occupied) {
  background-color: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.2);
}

/* Light theme hover effect */
:global(.light-theme) .table-cell:hover:not(.occupied) {
  background-color: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
}

/* Fixed Scale Widget */
.fixed-scale-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: var(--scale-widget-bg);
  border: 1px solid var(--scale-widget-border);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1500;
  box-shadow: 0 4px 12px var(--scale-widget-shadow);
  transition: all 0.3s ease;
}

.scale-label {
  color: var(--scale-btn-text);
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s ease;
}

.scale-buttons {
  display: flex;
  gap: 8px;
}

.scale-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background-color: var(--scale-btn-bg);
  color: var(--scale-btn-text);
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.scale-btn:hover {
  background-color: var(--scale-btn-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--scale-widget-shadow);
}

.light-theme .scale-btn:hover {
  background-color: #d0d0d0;
}

.scale-btn:active {
  background-color: var(--scale-btn-active);
  transform: translateY(0);
  box-shadow: 0 1px 4px var(--scale-widget-shadow);
}

/* Drag states */
.table-cell.dragging {
  background-color: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
}

/* Horizontal drag indicator - override vertical drag when horizontal */
.table-cell.dragging-horizontal {
  background-color: rgba(16, 185, 129, 0.1) !important;
  border: 2px dashed #10b981 !important;
  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.3) !important;
}

/* Table column highlight during horizontal drag */
.table-column.dragging-horizontal {
  background-color: rgba(16, 185, 129, 0.05);
}

/* Occupied cells - cannot start drag here */
.table-cell.occupied {
  cursor: not-allowed;
  background-color: rgba(239, 68, 68, 0.05);
}

.table-cell.occupied:hover {
  background-color: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.2);
}

/* Light theme occupied hover effect */
:global(.light-theme) .table-cell.occupied:hover {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.3);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.modal-content {
  background-color: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-color);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.order-details {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.detail-value {
  color: var(--text-primary);
  font-weight: 500;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--accent-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background-color: #505050;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
