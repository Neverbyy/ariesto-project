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

html,
body {
  width: 100%;
  max-width: 100%;
  height: auto;
}

body {
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#app {
  width: 100%;
  max-width: 100%;
}
</style>
