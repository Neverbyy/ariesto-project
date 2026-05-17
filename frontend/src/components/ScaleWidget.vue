<template>
  <div class="fixed-scale-widget">
    <div class="scale-label">Масштаб</div>
    <div class="scale-buttons">
      <button class="scale-btn" @click="emit('decrease')">-</button>
      <button class="scale-btn" @click="emit('increase')">+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  increase: [];
  decrease: [];
}>();
</script>

<style scoped>
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
  z-index: 3000;
  box-shadow: 0 4px 12px var(--scale-widget-shadow);
  transition: all 0.3s ease;
}

.scale-label {
  color: var(--scale-btn-text);
  font-size: 14px;
  font-weight: 500;
}

.scale-buttons { display: flex; gap: 8px; }

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

.scale-btn:active {
  background-color: var(--scale-btn-active);
  transform: translateY(0);
}

@media (max-width: 460px) {
  .fixed-scale-widget { bottom: 1rem; right: 1rem; transform: scale(0.8); }
}
</style>
