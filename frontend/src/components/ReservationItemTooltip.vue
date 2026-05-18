<template>
  <Tooltip
    placement="top"
    :mouse-enter-delay="0.4"
    overlay-class-name="reservation-tooltip"
  >
    <template #title>
      <div
        v-for="(line, i) in lines"
        :key="i"
        class="reservation-tooltip-line"
      >{{ line }}</div>
    </template>
    <slot />
  </Tooltip>
</template>

<script setup lang="ts">
import { Tooltip } from 'ant-design-vue';

defineProps<{
  lines: readonly string[];
}>();
</script>

<style>
.reservation-tooltip .reservation-tooltip-line {
  font-size: 0.8rem;
  line-height: 1.35;
  white-space: nowrap;
}
</style>
