<script setup lang="ts">
import { computed } from 'vue';
import { ConfigProvider, App as AntApp, theme } from 'ant-design-vue';
import ReservationPage from './components/ReservationPage.vue';
import { useTheme } from './composables/useTheme';

// Тема — singleton, шапка переключает один и тот же ref.
// ConfigProvider даёт темизацию всем дочерним antd-компонентам,
// AntApp требуется, чтобы App.useApp() (message/Modal) тоже подхватил тему.
const { isDarkTheme } = useTheme();

// Мемоизируем два варианта config-объекта — каждый из них стабильный по ссылке.
// computed возвращает одно из двух, что уменьшает шанс лишних ре-инициализаций
// внутри ConfigProvider при повторных переключениях туда-обратно.
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
  /*
   * Сбрасываем height: 100% из ant-design-vue/dist/reset.css.
   * С height: 100% body становится ровно 100vh, и наш контент с min-height: 100vh
   * (+ хедер, паддинги, грид) торчит за пределы body — в "щель" между body и html
   * проступают антд-цвета (тонкая голубоватая рамка по краям в светлой теме).
   */
  height: auto;
}

/*
 * Фон html нужен явно для обеих тем: контент может перерасти body даже без height:100%
 * (на коротких страницах body короче контента); тогда фон, виден за body, — это фон html.
 */
html {
  background-color: #1a1a1a;
}

html.light-theme {
  background-color: #f5f5f5;
}

/*
 * overflow-x: hidden ставим ТОЛЬКО на body, не на html.
 * Если задать обоим, спецификация CSS неявно делает overflow-y: auto на каждом —
 * и html, и body становятся скролл-контейнерами одновременно (двойной скролл в light theme).
 */
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

/*
 * min-height: 100vh держим только на .reservation-page (один источник истины).
 * Стэкать его на #app и .ant-app тоже — лишнее: дочерний 100vh-блок и так
 * растянет родителей нормальным flow-ом.
 */

/*
 * Transitions для смены темы.
 *
 * useTheme() ставит класс .theme-switching на <html> на ~320мс при toggleTheme().
 *
 * Селектор намеренно НЕ универсальный (* был лагучим): на 300+ ячейках сетки и
 * десятках карточек одновременная 300мс-анимация bg/border создаёт сильный
 * каскад перерисовок. Фейдим только крупный "хром" — body/page/header/секции
 * сетки. Мелкие элементы (cells, cards, buttons) переключаются мгновенно —
 * на фоне общего fade этого визуально не видно, зато нет лагов.
 *
 * !important перебивает локальные transition: all внутри NewOrderModal / Scale,
 * чтобы они тоже фейдили только цветовые свойства, а не "всё подряд".
 */
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

/* CSS-переменные нашей кастомной темы (используются нашими компонентами, не antd) */
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
