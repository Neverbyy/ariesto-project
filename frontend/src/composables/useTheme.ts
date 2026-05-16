import { ref, type Ref } from 'vue';

const STORAGE_KEY = 'isDarkTheme';
const NO_TRANSITIONS_CLASS = 'no-transitions';

function loadInitial(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return JSON.parse(saved);
  } catch (error) {
    console.error('Error loading theme:', error);
  }
  return true;
}

function applyThemeClass(isDark: boolean) {
  document.documentElement.classList.toggle('light-theme', !isDark);
  document.body.classList.toggle('light-theme', !isDark);
}

function persist(isDark: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isDark));
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}

// Lazy singleton: ref создаётся при первом useTheme(); до этого модуль не имеет
// side-effects.
let isDarkTheme: Ref<boolean> | null = null;

function ensureInitialized(): Ref<boolean> {
  if (isDarkTheme) return isDarkTheme;
  const initial = loadInitial();
  isDarkTheme = ref(initial);
  applyThemeClass(initial);
  return isDarkTheme;
}

export function useTheme() {
  const state = ensureInitialized();

  /**
   * Стратегия: мгновенное переключение без джанка.
   *
   * 1. Сразу глушим все transitions через класс .no-transitions (определён в App.vue).
   *    Без этого `transition: all 0.2s` на сотнях ячеек/карточек начал бы
   *    300мс анимацию bg-color и блокировал основной поток.
   * 2. Меняем CSS-классы темы императивно — браузер делает один style recalc.
   * 3. Force reflow (offsetHeight) — заставляем браузер закрыть кадр с активным
   *    no-transitions, иначе он может склеить add+remove в один кадр и анимации
   *    всё равно проиграют.
   * 4. Обновление Vue-state (`state.value = next`) откладываем на следующий
   *    кадр через RAF. Это нужно потому, что обновление триггерит ConfigProvider
   *    → antd cssinjs регенерирует токены — это синхронные ~30мс работы.
   *    Если делать это до отрисовки первого кадра — пользователь видит лаг.
   *    После RAF клик уже отрисовался, antd регенерируется "за кадром".
   * 5. Второй RAF снимает no-transitions, возвращая обычные hover/focus анимации.
   */
  const toggleTheme = () => {
    const next = !state.value;
    const root = document.documentElement;

    root.classList.add(NO_TRANSITIONS_CLASS);
    applyThemeClass(next);
    persist(next);
    // Force reflow — фиксируем no-transitions кадр
    void root.offsetHeight;

    requestAnimationFrame(() => {
      // Тянет за собой ConfigProvider (header icon, antd cssinjs)
      state.value = next;
      requestAnimationFrame(() => {
        root.classList.remove(NO_TRANSITIONS_CLASS);
      });
    });
  };

  return { isDarkTheme: state, toggleTheme };
}
