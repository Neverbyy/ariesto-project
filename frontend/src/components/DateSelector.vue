<template>
  <div class="date-section">
    <label>Дата</label>
    <div class="date-buttons">
      <button
        v-for="day in availableDays"
        :key="day"
        :class="['date-btn', { active: selectedDate === day }]"
        @click="emit('select', day)"
      >
        <div class="date-day">{{ formatDate(day).day }} {{ formatDate(day).month }}</div>
        <div class="date-label">{{ formatDate(day).label }}</div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '../utils/time';

defineProps<{
  availableDays: string[];
  selectedDate: string;
}>();

const emit = defineEmits<{
  select: [date: string];
}>();
</script>

<style scoped>
.date-section { margin-bottom: 2rem; width: 100%; }
.date-section label {
  display: block;
  text-align: left;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}
.date-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; width: 100%; }

.date-btn {
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

.date-btn:hover { background-color: #505050; }
.date-btn.active { background-color: var(--accent-color); color: #ffffff; }
.date-btn.active .date-label { color: #ffffff; }

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
}

@media (max-width: 460px) {
  .date-section { margin-bottom: 1rem; }
  .date-section label { font-size: 14px; }
  .date-buttons { gap: 0.5rem; }
  .date-btn { padding: 0.5rem; font-size: 10px; flex: 1; min-width: 0; }
  .date-btn .date-day { font-size: 10px; }
  .date-btn .date-label { font-size: 10px; }
}
</style>
