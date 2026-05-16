import { ref, computed, onMounted, onUnmounted } from 'vue';
import { toMinutes } from '../utils/time';

/** Реактивное «сейчас» в формате ЧЧ:ММ. Обновляется раз в минуту. */
export function useCurrentTime() {
  const currentTime = ref<string>(formatNow());
  let intervalId: number | null = null;

  const update = () => {
    currentTime.value = formatNow();
  };

  onMounted(() => {
    update();
    intervalId = window.setInterval(update, 60_000);
  });

  onUnmounted(() => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });

  const currentMinutes = computed(() => toMinutes(currentTime.value));

  return { currentTime, currentMinutes };
}

function formatNow(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
