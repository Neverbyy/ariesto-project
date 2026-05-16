<template>
  <Transition>
    <div
      v-if="visible"
      class="page-loading-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="spinner" aria-hidden="true"></div>
      <div class="loading-text">
        <slot>Загрузка данных…</slot>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean }>();
</script>

<style scoped>
.page-loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 4000;
  backdrop-filter: blur(2px);
}

.spinner {
  width: 42px;
  height: 42px;
  border: 4px solid rgba(255, 255, 255, 0.25);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  margin-top: 12px;
  color: var(--text-primary);
  font-size: 14px;
  opacity: 0.9;
}

@keyframes spin { to { transform: rotate(360deg); } }

.v-enter-active,
.v-leave-active { transition: opacity 0.15s ease; }
.v-enter-from,
.v-leave-to { opacity: 0; }
</style>
