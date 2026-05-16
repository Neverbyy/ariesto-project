<template>
  <div class="zone-section">
    <label>Отображаемые зоны</label>
    <div class="zone-buttons">
      <button
        v-for="zone in zones"
        :key="zone"
        :class="['zone-btn', { active: selectedZones.includes(zone) }]"
        @click="emit('toggle', zone)"
      >
        {{ zone }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  zones: string[];
  selectedZones: string[];
}>();

const emit = defineEmits<{
  toggle: [zone: string];
}>();
</script>

<style scoped>
.zone-section { margin-bottom: 2rem; width: 100%; }
.zone-section label {
  display: block;
  text-align: left;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}
.zone-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; width: 100%; }

.zone-btn {
  background-color: var(--bg-tertiary);
  border: none;
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 18px;
}

.zone-btn:hover { background-color: #505050; }
.zone-btn.active { background-color: var(--accent-color); color: #ffffff; }

@media (max-width: 460px) {
  .zone-section { margin-bottom: 1rem; }
  .zone-section label { font-size: 14px; }
  .zone-btn { padding: 0.5rem; font-size: 10px; flex: 1; min-width: 0; }
}
</style>
