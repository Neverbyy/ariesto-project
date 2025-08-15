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
        <button class="theme-toggle">☀️</button>
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

      <!-- Reservation Grid -->
      <div class="reservation-grid-container">
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
              >
                <div
                  v-for="timeSlot in timeSlots"
                  :key="timeSlot"
                  class="table-cell"
                >
                  <ReservationItem
                    v-for="item in getItemsForTableAndTime(table, timeSlot)"
                    :key="`${table.id}-${timeSlot}-${item.id}-${item.type}`"
                    :item="item"
                    :time-slot="timeSlot"
                    @click="handleItemClick"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
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
const selectedZones = ref<ZoneType[]>(['1 этаж', '2 этаж']);
const searchQuery = ref<string>('');

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

const filteredTables = computed(() => {
  return tables.value.filter(table => selectedZones.value.includes(table.zone));
});

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
  
  console.log('Generated time slots:', slots);
  return slots;
});

// Methods
const fetchReservationData = async (date: string) => {
  try {
    console.log(`Fetching data for date: ${date}`);
    const data = await reservationApi.getReservations(date);
    console.log('Data received from API:', data);
    console.log('Tables count:', data.tables?.length || 0);
    
    // Debug: show all orders from all tables
    data.tables?.forEach((table, index) => {
      if (table.orders && table.orders.length > 0) {
        console.log(`Table ${table.number} orders from API:`, table.orders.map(o => ({
          id: o.id,
          status: o.status,
          start_time: o.start_time,
          end_time: o.end_time
        })));
      }
    });
    
    reservationData.value = data;
  } catch (error) {
    console.error('Error fetching reservation data:', error);
    console.log('API ERROR - NOT using mock data');
    // Temporarily disable mock data fallback
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
  console.log('Clicked item:', item);
  // Здесь можно добавить логику для открытия модального окна с деталями
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
  if (table.orders.length > 0) {
    console.log(`Table ${table.number} orders:`, table.orders.map(o => ({
      id: o.id,
      status: o.status,
      start: extractTimeFromISO(o.start_time),
      end: extractTimeFromISO(o.end_time)
    })));
  }
  
  if (table.reservations.length > 0) {
    console.log(`Table ${table.number} reservations:`, table.reservations.map(r => ({
      id: r.id,
      name: r.name_for_reservation,
      status: r.status,
      start: extractTimeFromISO(r.seating_time),
      end: extractTimeFromISO(r.end_time)
    })));
  }
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
  
  // Log table data only once per table (when timeSlot is the first one)
  if (timeSlot === timeSlots.value[0]) {
    logTableData(table);
  }
  
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
      
      // Debug logging for table 28
      if (table.number === '28') {
        console.log(`Item ${item.id} (${item.startTime}-${item.endTime}) has overlapIndex: ${overlapIndex}`);
        console.log('Overlapping items (any type):', overlappingItems.map(o => `${o.id} (${o.startTime}-${o.endTime})`));
        console.log('Sorted overlapping group:', allOverlapping.map(o => `${o.id} (${o.startTime}-${o.endTime})`));
      }
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
      // Для заказов показываем в слоте начала, для бронирований - в слоте начала
      const shouldShow = item.type === 'order' 
        ? item.startTime === timeSlot // Заказы показываем в слоте начала
        : item.startTime === timeSlot; // Бронирования показываем в слоте начала
      
      if (shouldShow) {
        items.push(item);
      }
    }
  });
  
  return items;
};



// Lifecycle
onMounted(() => {
  const today = new Date().toISOString().split('T')[0];
  selectedDate.value = today;
  console.log('Component mounted, fetching data for:', today);
  fetchReservationData(today);
});
</script>

<style scoped>
.reservation-page {
  background-color: #1a1a1a;
  color: #ffffff;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  width: 100%;
  max-width: 100%;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #2a2a2a;
  border-bottom: 1px solid #404040;
  width: 100%;
  max-width: 100%;
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
  background-color: #404040;
  border-radius: 6px;
  padding: 0.5rem 1rem;
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
  background-color: #404040;
  border: none;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
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
  color: #e0e0e0;
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
  background-color: #404040;
  border: none;
  color: #ffffff;
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
  background-color: #0066cc;
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
  color: #808080;
  line-height: 1;
  text-transform: lowercase;
  text-align: left;
}

/* Reservation Grid */
.reservation-grid-container {
  overflow: hidden;
  border: 1px solid #404040;
  border-radius: 8px;
  width: 100%;
}

.grid-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.table-headers {
  display: flex;
  background-color: #2a2a2a;
  border-bottom: 1px solid #404040;
  position: sticky;
  top: 0;
  z-index: 10;
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
  min-width: 0;
  padding: 1rem 0.5rem;
  border-right: 1px solid #404040;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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
  background-color: #2a2a2a;
  position: sticky;
  left: 0;
  z-index: 5;
}

.time-cell {
  height: 50px;
  padding: 0.5rem;
  border-bottom: 1px solid #404040;
  border-right: 1px solid #404040;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tables-columns {
  display: flex;
  flex: 1;
}

.table-column {
  flex: 1;
  min-width: 0;
}

.table-cell {
  height: 50px;
  border-bottom: 1px solid #404040;
  border-right: 1px solid #404040;
  position: relative;
  padding: 2px;
  overflow: visible;
  min-height: 50px;
}


</style>
