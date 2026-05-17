import { ref, type Ref } from 'vue';

const STORAGE_KEY = 'isDarkTheme';

let state: Ref<boolean> | null = null;

function loadInitial(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return JSON.parse(saved);
  } catch (error) {
    console.error('Error loading theme:', error);
  }
  return true;
}

function applyClass(isDark: boolean) {
  document.documentElement.classList.toggle('light-theme', !isDark);
}

function persist(isDark: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isDark));
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}

export function useTheme() {
  if (!state) {
    const initial = loadInitial();
    state = ref(initial);
    applyClass(initial);
  }

  const toggleTheme = () => {
    const next = !state!.value;
    applyClass(next);
    persist(next);
    state!.value = next;
  };

  return { isDarkTheme: state, toggleTheme };
}
