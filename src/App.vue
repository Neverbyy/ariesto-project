<script setup lang="ts">
import ReservationPage from './components/ReservationPage.vue'
</script>

<template>
  <ReservationPage />
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
  overflow-x: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #1a1a1a;
  color: #ffffff;
}

#app {
  width: 100%;
  max-width: 100%;
}
</style>
