<template>
  <header class="header">
    <div class="header-left">
      <h1 class="brand">AIRESTO | {{ restaurantName || 'Супра' }}</h1>
    </div>
    <div class="header-right">
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input
          :value="searchQuery"
          type="text"
          placeholder="Поиск заказов"
          @input="(e) => emit('update:searchQuery', (e.target as HTMLInputElement).value)"
          @keyup.enter="emit('search')"
        />
      </div>
      <button class="theme-toggle" @click="emit('toggle-theme')">
        {{ isDarkTheme ? '☀️' : '🌙' }}
      </button>
      <button class="exit-btn">
        <span>Выйти</span>
        <span class="arrow">→</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  restaurantName?: string | null;
  searchQuery: string;
  isDarkTheme: boolean;
}>();

const emit = defineEmits<{
  'update:searchQuery': [value: string];
  search: [];
  'toggle-theme': [];
}>();
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
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
  background-color: var(--bg-tertiary);
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
  background-color: var(--bg-tertiary);
  border: none;
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.arrow {
  font-size: 0.8rem;
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

  .search-bar { width: 100%; max-width: none; }
  .search-bar input { font-size: 14px; padding: 0.5rem; width: 100%; }
  .theme-toggle, .exit-btn { width: 100%; padding: 0.5rem; font-size: 14px; }
}
</style>
