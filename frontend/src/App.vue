<script setup lang="ts">
import ReservationPage from './components/ReservationPage.vue'
import { ref, onMounted, watch } from 'vue'

// Theme state
const isDarkTheme = ref(true)

// Load theme from localStorage
const loadTheme = () => {
  try {
    const saved = localStorage.getItem('isDarkTheme')
    if (saved !== null) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading theme from localStorage:', error)
  }
  return true // Default to dark theme
}

// Watch for theme changes and update body classes
watch(isDarkTheme, (newTheme) => {
  document.body.classList.toggle('light-theme', !newTheme)
  document.documentElement.classList.toggle('light-theme', !newTheme)
})

onMounted(() => {
  isDarkTheme.value = loadTheme()
  
  // Listen for theme changes from child components
  window.addEventListener('storage', (e) => {
    if (e.key === 'isDarkTheme') {
      isDarkTheme.value = e.newValue === 'true'
    }
  })
})
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
  transition: background-color 0.3s ease, color 0.3s ease;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #1a1a1a;
  color: #ffffff;
}

/* Light theme styles */
body.light-theme {
  background-color: #f5f5f5;
  color: #333333;
}

html.light-theme {
  background-color: #f5f5f5;
}

#app {
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
  transition: background-color 0.3s ease;
}

/* CSS Variables for theme colors */
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --bg-tertiary: #404040;
  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --text-muted: #a0a0a0;
  --border-color: #404040;
  --accent-color: #0066cc;
  
  /* Card colors for dark theme */
  --card-order-regular: #7FD7CC;
  --card-order-banquet: #B348F7;
  --card-reservation-live: #0097FD;
  --card-reservation-regular: #FF7043;
  
  /* Scale widget colors for dark theme */
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
  
  /* Card colors for light theme - more saturated */
  --card-order-regular: #00B8A9;
  --card-order-banquet: #9C27B0;
  --card-reservation-live: #1976D2;
  --card-reservation-regular: #F57C00;
  
  /* Scale widget colors for light theme */
  --scale-widget-bg: #ffffff;
  --scale-widget-border: #e0e0e0;
  --scale-widget-shadow: rgba(0, 0, 0, 0.1);
  --scale-btn-bg: #f5f5f5;
  --scale-btn-hover: #e0e0e0;
  --scale-btn-active: #d0d0d0;
  --scale-btn-text: #333333;
}
</style>
