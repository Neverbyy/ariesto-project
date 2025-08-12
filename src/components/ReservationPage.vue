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
                    :key="item.id"
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
  // Если есть данные от API, используем их, иначе генерируем динамически
  if (reservationData.value?.available_days && reservationData.value.available_days.length > 0) {
    return reservationData.value.available_days;
  }
  
  // Используем функцию для генерации 7 дней
  return getAvailableDays();
});
const tables = computed(() => reservationData.value?.tables || []);

const zones: ZoneType[] = ['1 этаж', '2 этаж', 'Банкетный зал'];

const filteredTables = computed(() => {
  return tables.value.filter(table => selectedZones.value.includes(table.zone));
});

const timeSlots = computed(() => {
  if (!restaurant.value) return [];
  
  const slots = [];
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
    const data = await reservationApi.getReservations(date);
    reservationData.value = data;
  } catch (error) {
    console.error('Error fetching reservation data:', error);
    // Fallback to mock data for development
    reservationData.value = getMockData(date);
  }
};

const getMockData = (date: string): ReservationData => {
  return {
    available_days: getAvailableDays(),
    current_day: date,
    restaurant: {
      id: 11100,
      timezone: 'Asia/Vladivostok',
      restaurant_name: 'Супра',
      opening_time: '11:00',
      closing_time: '23:40'
    },
    tables: [
      {
        id: '1',
        capacity: 2,
        number: '5',
        zone: '1 этаж',
        orders: [
          {
            id: '1',
            status: 'New',
            start_time: `${date}T13:00:00+10:00`,
            end_time: `${date}T14:00:00+10:00`
          }
        ],
        reservations: []
      },
      {
        id: '2',
        capacity: 2,
        number: '6',
        zone: '1 этаж',
        orders: [
          {
            id: '2',
            status: 'Bill',
            start_time: `${date}T13:00:00+10:00`,
            end_time: `${date}T14:00:00+10:00`
          }
        ],
        reservations: []
      },
      {
        id: '3',
        capacity: 6,
        number: '155',
        zone: '2 этаж',
        orders: [
          {
            id: '3',
            status: 'Closed',
            start_time: `${date}T13:00:00+10:00`,
            end_time: `${date}T14:00:00+10:00`
          }
        ],
        reservations: []
      },
      {
        id: '4',
        capacity: 4,
        number: '20',
        zone: '1 этаж',
        orders: [],
        reservations: [
          {
            id: 111,
            name_for_reservation: 'Миша',
            num_people: 4,
            phone_number: '+79999999999',
            status: 'Живая очередь',
            seating_time: `${date}T13:00:00+10:00`,
            end_time: `${date}T14:00:00+10:00`
          }
        ]
      },
      {
        id: '5',
        capacity: 6,
        number: '21',
        zone: '1 этаж',
        orders: [],
        reservations: [
          {
            id: 111,
            name_for_reservation: 'Алина',
            num_people: 6,
            phone_number: '+79999999999',
            status: 'Новая',
            seating_time: `${date}T13:00:00+10:00`,
            end_time: `${date}T14:00:00+10:00`
          }
        ]
      },
      {
        id: '6',
        capacity: 6,
        number: '22',
        zone: '1 этаж',
        orders: [],
        reservations: [
          {
            id: 111,
            name_for_reservation: 'Алина',
            num_people: 6,
            phone_number: '+79999999999',
            status: 'Заявка',
            seating_time: `${date}T13:00:00+10:00`,
            end_time: `${date}T14:00:00+10:00`
          }
        ]
      },
      {
        id: '7',
        capacity: 6,
        number: '23',
        zone: '1 этаж',
        orders: [],
        reservations: [
          {
            id: 111,
            name_for_reservation: 'Алина',
            num_people: 6,
            phone_number: '+79999999999',
            status: 'Открыт',
            seating_time: `${date}T13:00:00+10:00`,
            end_time: `${date}T14:00:00+10:00`
          }
        ]
      },
      {
        id: '8',
        capacity: 6,
        number: '24',
        zone: '1 этаж',
        orders: [],
        reservations: [
          {
            id: 111,
            name_for_reservation: 'Алина',
            num_people: 6,
            phone_number: '+79999999999',
            status: 'Закрыт',
            seating_time: `${date}T13:00:00+10:00`,
            end_time: `${date}T14:00:00+10:00`
          }
        ]
      },
      {
        id: '9',
        capacity: 4,
        number: '28',
        zone: '2 этаж',
        orders: [
          {
            id: '4',
            status: 'Closed',
            start_time: `${date}T12:32:00+10:00`,
            end_time: `${date}T13:01:00+10:00`
          },
          {
            id: '5',
            status: 'Bill',
            start_time: `${date}T13:43:00+10:00`,
            end_time: `${date}T14:41:00+10:00`
          }
        ],
        reservations: []
      },
      {
        id: '10',
        capacity: 4,
        number: '29',
        zone: '2 этаж',
        orders: [
          {
            id: '6',
            status: 'Closed',
            start_time: `${date}T12:06:00+10:00`,
            end_time: `${date}T12:51:00+10:00`
          },
          {
            id: '7',
            status: 'Bill',
            start_time: `${date}T13:17:00+10:00`,
            end_time: `${date}T14:12:00+10:00`
          }
        ],
        reservations: []
      },
      {
        id: '11',
        capacity: 6,
        number: '30',
        zone: '2 этаж',
        orders: [],
        reservations: []
      },
      {
        id: '12',
        capacity: 8,
        number: '191',
        zone: 'Банкетный зал',
        orders: [
          {
            id: '8',
            status: 'Banquet',
            start_time: `${date}T13:00:00+10:00`,
            end_time: `${date}T14:00:00+10:00`
          }
        ],
        reservations: []
      }
    ]
  };
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
      const data = await reservationApi.searchReservations(searchQuery.value);
      reservationData.value = data;
    } catch (error) {
      console.error('Error searching reservations:', error);
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

// Функция для получения доступных дней (7 дней, начиная с сегодняшнего)
const getAvailableDays = () => {
  const today = new Date();
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);
    days.push(day.toISOString().split('T')[0]);
  }
  
  return days;
};

const getItemsForTableAndTime = (table: Table, timeSlot: string) => {
  const items: Array<any> = [];
  
  // Add orders
  table.orders.forEach(order => {
    const startTime = new Date(order.start_time).toTimeString().slice(0, 5);
    if (startTime === timeSlot) {
      items.push({ ...order, type: 'order' });
    }
  });
  
  // Add reservations
  table.reservations.forEach(reservation => {
    const startTime = new Date(reservation.seating_time).toTimeString().slice(0, 5);
    if (startTime === timeSlot) {
      items.push({ ...reservation, type: 'reservation' });
    }
  });
  
  return items;
};



// Lifecycle
onMounted(() => {
  const today = new Date().toISOString().split('T')[0];
  selectedDate.value = today;
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
}


</style>
