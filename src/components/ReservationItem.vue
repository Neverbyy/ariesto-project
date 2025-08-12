<template>
  <div
    :class="['reservation-item', itemClass]"
    :style="itemStyle"
    @click="handleClick"
  >
    <div class="item-content">
      <div class="item-title">{{ itemTitle }}</div>
      <div v-if="itemSubtitle" class="item-subtitle">{{ itemSubtitle }}</div>
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

const itemStyle = computed(() => {
  const startTime = new Date(props.item.type === 'order' ? props.item.start_time : props.item.seating_time);
  const endTime = new Date(props.item.type === 'order' ? props.item.end_time : props.item.end_time);
  
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
  const duration = endMinutes - startMinutes;
  
  return {
    height: `${duration / config.grid.timeSlotMinutes * config.grid.timeSlotHeight}px`,
    minHeight: `${config.grid.timeSlotHeight}px`
  };
});

const itemTitle = computed(() => {
  if (props.item.type === 'order') {
    const statusMap: Record<string, string> = {
      'New': 'Новый',
      'Bill': 'Пречек',
      'Closed': 'Закрытый',
      'Banquet': 'Банкет'
    };
    
    const startTime = new Date(props.item.start_time).toTimeString().slice(0, 5);
    const endTime = new Date(props.item.end_time).toTimeString().slice(0, 5);
    
    return `Заказ ${statusMap[props.item.status] || props.item.status} ${startTime}-${endTime}`;
  } else {
    const startTime = new Date(props.item.seating_time).toTimeString().slice(0, 5);
    const endTime = new Date(props.item.end_time).toTimeString().slice(0, 5);
    
    return `№${props.item.id} ${props.item.name_for_reservation} ${startTime}-${endTime}`;
  }
});

const itemSubtitle = computed(() => {
  if (props.item.type === 'reservation') {
    const phoneSuffix = props.item.phone_number.slice(-4);
    return `${props.item.num_people}чел ${props.item.status} ${phoneSuffix}`;
  }
  return null;
});

const handleClick = () => {
  emit('click', props.item);
};
</script>

<style scoped>
.reservation-item {
  position: absolute;
  left: 2px;
  right: 2px;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.2s;
  color: #ffffff;
}

.reservation-item:hover {
  opacity: 0.8;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.item-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
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
  background-color: v-bind('config.colors.orderNew');
}

.order-bill {
  background-color: v-bind('config.colors.orderBill');
}

.order-closed {
  background-color: v-bind('config.colors.orderClosed');
}

.order-banquet {
  background-color: v-bind('config.colors.orderBanquet');
}

.order-default {
  background-color: #607d8b;
}

/* Reservation Items */
.reservation-item:not(.order-new):not(.order-bill):not(.order-closed):not(.order-banquet):not(.order-default) {
  background-color: v-bind('config.colors.reservation');
}
</style>
