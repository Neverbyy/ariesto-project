import { ref } from 'vue';

const MIN = 0.5;
const MAX = 3;
const STEP = 0.08;

/** Масштаб сетки: горизонтальный (столбцы) и вертикальный (временные слоты). */
export function useScale() {
  const horizontalScale = ref(0.5);
  const verticalScale = ref(0.5);

  const increaseScale = () => {
    horizontalScale.value = Math.min(horizontalScale.value + STEP, MAX);
    verticalScale.value = Math.min(verticalScale.value + STEP, MAX);
  };

  const decreaseScale = () => {
    horizontalScale.value = Math.max(horizontalScale.value - STEP, MIN);
    verticalScale.value = Math.max(verticalScale.value - STEP, MIN);
  };

  return { horizontalScale, verticalScale, increaseScale, decreaseScale };
}
