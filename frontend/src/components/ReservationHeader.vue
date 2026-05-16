<template>
  <header class="header">
    <div class="header-left">
      <h1 class="brand">AIRESTO | {{ restaurantName || 'Супра' }}</h1>
    </div>
    <div class="header-right">
      <AInput
        class="search-bar"
        :value="searchQuery"
        placeholder="Поиск заказов"
        allow-clear
        @update:value="(v: string) => emit('update:searchQuery', v)"
      >
        <template #prefix>
          <SearchOutlined />
        </template>
      </AInput>
      <button
        type="button"
        class="icon-button theme-toggle"
        :title="isDarkTheme ? 'Светлая тема' : 'Тёмная тема'"
        @click="emit('toggle-theme')"
      >
        <SunIcon v-if="isDarkTheme" />
        <MoonIcon v-else />
      </button>
      <button type="button" class="icon-button exit-btn">
        <LogoutIcon />
        <span>Выйти</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Input as AInput } from 'ant-design-vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import SunIcon from '../assets/icons/SunIcon.vue';
import MoonIcon from '../assets/icons/MoonIcon.vue';
import LogoutIcon from '../assets/icons/LogoutIcon.vue';

defineProps<{
  restaurantName?: string | null;
  searchQuery: string;
  isDarkTheme: boolean;
}>();

const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'toggle-theme': [];
}>();
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  z-index: 2100;
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
  width: 260px;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 44px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0 1.1rem;
  transition: background-color 0.15s ease;
}

.icon-button:hover {
  background-color: color-mix(in srgb, var(--bg-tertiary) 80%, var(--text-primary) 12%);
}

.theme-toggle {
  width: 44px;
  padding: 0;
}

.icon-button svg {
  flex-shrink: 0;
}

@media (max-width: 460px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0.5rem;
  }

  .header-left .brand {
    font-size: 1.2rem;
    text-align: center;
  }

  .header-right {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .search-bar { width: 100%; }
  .icon-button { width: 100%; padding: 0 0.75rem; font-size: 14px; }
  .theme-toggle { width: 100%; }
}
</style>
