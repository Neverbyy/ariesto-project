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

  const toggleTheme = () => {
    const next = !state.value;
    const root = document.documentElement;

    root.classList.add(NO_TRANSITIONS_CLASS);
    applyThemeClass(next);
    persist(next);

    void root.offsetHeight;

    requestAnimationFrame(() => {

      state.value = next;
      requestAnimationFrame(() => {
        root.classList.remove(NO_TRANSITIONS_CLASS);
      });
    });
  };

  return { isDarkTheme: state, toggleTheme };
}
