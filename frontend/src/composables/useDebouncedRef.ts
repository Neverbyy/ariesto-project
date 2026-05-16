import { ref, watch, onUnmounted, type Ref } from 'vue';

export function useDebouncedRef<T>(source: Ref<T>, delayMs: number): Ref<T> {
  const debounced = ref(source.value) as Ref<T>;
  let timer: ReturnType<typeof setTimeout> | null = null;

  watch(source, (value) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      debounced.value = value;
      timer = null;
    }, delayMs);
  });

  onUnmounted(() => {
    if (timer !== null) clearTimeout(timer);
  });

  return debounced;
}
