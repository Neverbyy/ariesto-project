<script setup lang="ts">
import { computed } from 'vue';
import { ConfigProvider, App as AntApp, theme } from 'ant-design-vue';
import ReservationPage from './components/ReservationPage.vue';
import { useTheme } from './composables/useTheme';

const { isDarkTheme } = useTheme();

const ANT_THEME_DARK = { algorithm: theme.darkAlgorithm };
const ANT_THEME_LIGHT = { algorithm: theme.defaultAlgorithm };
const antTheme = computed(() => isDarkTheme.value ? ANT_THEME_DARK : ANT_THEME_LIGHT);
</script>

<template>
  <ConfigProvider :theme="antTheme">
    <AntApp>
      <ReservationPage />
    </AntApp>
  </ConfigProvider>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  max-width: 100%;

  height: auto;
}

html {
  background-color: #1a1a1a;
}

html.light-theme {
  background-color: #f5f5f5;
}

body {
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #1a1a1a;
  color: #ffffff;
}

body.light-theme {
  background-color: #f5f5f5;
  color: #333333;
}

#app {
  width: 100%;
  max-width: 100%;
}

html.theme-switching,
html.theme-switching body,
html.theme-switching .reservation-page,
html.theme-switching .header,
html.theme-switching .main-content,
html.theme-switching .table-headers,
html.theme-switching .table-header-cell,
html.theme-switching .time-column,
html.theme-switching .reservation-grid-container,
html.theme-switching .drag-instructions,
html.theme-switching .fixed-scale-widget {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease !important;
}

:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --bg-tertiary: #404040;
  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --text-muted: #a0a0a0;
  --border-color: #404040;
  --accent-color: #0066cc;

  --card-order-regular: #7FD7CC;
  --card-order-banquet: #B348F7;
  --card-reservation-live: #0097FD;
  --card-reservation-regular: #FF7043;

  --scale-widget-bg: #2a2a2a;
  --scale-widget-border: #404040;
  --scale-widget-shadow: rgba(0, 0, 0, 0.3);
  --scale-btn-bg: #404040;
  --scale-btn-hover: #505050;
  --scale-btn-active: #606060;
  --scale-btn-text: #ffffff;
}

.light-theme {
  --bg-primary: #f5f5f5;
  --bg-secondary: #ffffff;
  --bg-tertiary: #e0e0e0;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  --border-color: #e0e0e0;
  --accent-color: #0066cc;

  --card-order-regular: #00B8A9;
  --card-order-banquet: #9C27B0;
  --card-reservation-live: #1976D2;
  --card-reservation-regular: #F57C00;

  --scale-widget-bg: #ffffff;
  --scale-widget-border: #e0e0e0;
  --scale-widget-shadow: rgba(0, 0, 0, 0.1);
  --scale-btn-bg: #f5f5f5;
  --scale-btn-hover: #e0e0e0;
  --scale-btn-active: #d0d0d0;
  --scale-btn-text: #333333;
}
</style>
