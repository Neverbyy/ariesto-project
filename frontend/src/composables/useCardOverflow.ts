import { ref, onMounted, onUpdated, onUnmounted } from 'vue';

export function useCardOverflow() {
  const cardEl = ref<HTMLElement | null>(null);
  const hasOverflow = ref(false);

  const measure = () => {
    const el = cardEl.value;
    if (!el) return;
    const overflow = el.scrollHeight - el.clientHeight > 1
      || el.scrollWidth - el.clientWidth > 1;
    if (hasOverflow.value !== overflow) hasOverflow.value = overflow;
  };

  let resizeObserver: ResizeObserver | null = null;

  onMounted(() => {
    measure();
    if (typeof ResizeObserver !== 'undefined' && cardEl.value) {
      resizeObserver = new ResizeObserver(() => requestAnimationFrame(measure));
      resizeObserver.observe(cardEl.value);
    }
  });

  onUpdated(() => requestAnimationFrame(measure));

  onUnmounted(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  });

  return { cardEl, hasOverflow };
}
