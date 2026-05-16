import { ref, watch, onMounted } from 'vue';

const STORAGE_KEY = 'selectedZones';

export function useSelectedZones(availableZones: string[], defaults: string[] = availableZones) {
  const selectedZones = ref<string[]>([...defaults]);

  onMounted(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        selectedZones.value = parsed.filter((zone) => availableZones.includes(zone));
        return;
      }
    } catch (error) {
      console.error('Error loading selected zones:', error);
    }
  });

  watch(selectedZones, (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving selected zones:', error);
    }
  }, { deep: true });

  const toggleZone = (zone: string) => {
    const index = selectedZones.value.indexOf(zone);
    if (index > -1) selectedZones.value.splice(index, 1);
    else selectedZones.value.push(zone);
  };

  return { selectedZones, toggleZone };
}
