<template>
  <div
    :class="['reservation-item', itemClass]"
    :style="itemStyle"
    @click="handleClick"
  >
    <div class="item-content">
      <!-- For orders: separate title, status badge, and time -->
      <template v-if="props.item.type === 'order'">
        <div class="item-title">{{ itemTitle }}</div>
        <div class="status-badge">{{ orderStatusText }}</div>
        <div class="time-display">{{ orderTimeText }}</div>
      </template>
      
      <!-- For reservations: separate name, time, status, people, and phone -->
      <template v-else>
        <div class="item-title">{{ itemTitle }}</div>
        <div class="time-display">{{ reservationTimeText }}</div>
        <div class="status-badge">{{ reservationStatusText }}</div>
        <div class="people-text">{{ reservationPeopleText }}</div>
        <div class="phone-text">{{ reservationPhoneText }}</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { config } from '../config';

interface Props {
  item: any;
  timeSlot: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [item: any];
}>();

const itemClass = computed(() => {
  if (props.item.type === 'order') {
    switch (props.item.status) {
      case 'New': return 'order-new';
      case 'Bill': return 'order-bill';
      case 'Closed': return 'order-closed';
      case 'Banquet': return 'order-banquet';
      default: return 'order-default';
    }
  } else {
    return 'reservation-item';
  }
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
  
  // Calculate position within the time slot
  const timeSlotTime = props.timeSlot;
  const [slotHours, slotMinutes] = timeSlotTime.split(':').map(Number);
  const slotTotalMinutes = slotHours * 60 + slotMinutes;
  
  // Calculate top offset if item doesn't start exactly at time slot
  const topOffset = startTotalMinutes > slotTotalMinutes 
    ? ((startTotalMinutes - slotTotalMinutes) / config.grid.timeSlotMinutes) * config.grid.timeSlotHeight
    : 0;
  
  // Calculate overlap offset - 10px margin-left for each overlapping item
  const overlapOffset = (props.item.overlapIndex || 0) * 10;
  
  // Calculate z-index based on start time - later times appear on top
  const zIndex = 10 + startTotalMinutes + (props.item.overlapIndex || 0);
  
  return {
    minHeight: `${config.grid.timeSlotHeight}px`,
    top: `${topOffset}px`,
    marginLeft: `${overlapOffset}px`,
    zIndex: zIndex
  };
});

const itemTitle = computed(() => {
  if (props.item.type === 'order') {
    return 'Заказ';
  } else {
    return props.item.name_for_reservation;
  }
});

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
    'Banquet': 'Банкет'
  };
  return statusMap[props.item.status] || props.item.status;
});

const orderTimeText = computed(() => {
  const startTime = extractTimeFromISO(props.item.start_time);
  const endTime = extractTimeFromISO(props.item.end_time);
  return `${startTime}-${endTime}`;
});

const reservationStatusText = computed(() => {
  if (props.item.type === 'reservation') {
    return props.item.status;
  }
  return '';
});

const reservationPeopleText = computed(() => {
  if (props.item.type === 'reservation') {
    return `${props.item.num_people} чел`;
  }
  return '';
});

const reservationPhoneText = computed(() => {
  if (props.item.type === 'reservation') {
    return `Тел: ${props.item.phone_number}`;
  }
  return '';
});

const itemSubtitle = computed(() => {
  if (props.item.type === 'order') {
    const statusMap: Record<string, string> = {
      'New': 'Новый',
      'Bill': 'Пречек',
      'Closed': 'Закрытый',
      'Banquet': 'Банкет'
    };
    
    const startTime = extractTimeFromISO(props.item.start_time);
    const endTime = extractTimeFromISO(props.item.end_time);
    
    return `${statusMap[props.item.status] || props.item.status} ${startTime}-${endTime}`;
  } else {
    const phoneSuffix = props.item.phone_number.slice(-4);
    return `${props.item.num_people}чел ${props.item.status} ${phoneSuffix}`;
  }
});

const handleClick = () => {
  console.log('ReservationItem clicked:', props.item);
  emit('click', props.item);
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
  transition: all 0.2s ease;
  color: #ffffff;
}

.reservation-item:hover {
  opacity: 0.9;
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
  text-align: left;
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
  background-color: #4a4a4a;
  color: #ffffff;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
}

.time-display {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  font-size: 0.9rem;
  margin: 0;
}

.people-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.7rem;
  opacity: 0.9;
  margin: 0;
}

.phone-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.7rem;
  opacity: 0.9;
  margin: 0;
}

.item-subtitle {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.7rem;
  opacity: 0.9;
}

/* Order Types */
.order-new {
  background-color: #2f3c3c;
  border-left: 3px solid #66b2b2;
}

.order-bill {
  background-color: #2f3c3c;
  border-left: 3px solid #66b2b2;
}

.order-closed {
  background-color: #2f3c3c;
  border-left: 3px solid #66b2b2;
}

.order-banquet {
  background-color: #2f3c3c;
  border-left: 3px solid #66b2b2;
}

.order-default {
  background-color: #2f3c3c;
  border-left: 3px solid #66b2b2;
}

/* Reservation Items */
.reservation-item:not(.order-new):not(.order-bill):not(.order-closed):not(.order-banquet):not(.order-default) {
  background-color: #2f3c3c;
  border-left: 3px solid #66b2b2;
}
</style>
