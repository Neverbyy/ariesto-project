import { computed, type ComputedRef, type Ref } from 'vue';
import type { SearchResult } from '../types/reservation';

interface UseSearchHighlightParams {
  results: Ref<SearchResult[]>;
  selectedDate: Ref<string>;
  query: Ref<string>;
}

interface UseSearchHighlightReturn {
  isSearchActive: ComputedRef<boolean>;
  matchedIds: ComputedRef<Set<string>>;
  otherDates: ComputedRef<{ date: string; count: number }[]>;
  totalCount: ComputedRef<number>;
  totalOther: ComputedRef<number>;
}

export function useSearchHighlight(params: UseSearchHighlightParams): UseSearchHighlightReturn {
  const { results, selectedDate, query } = params;

  const isSearchActive = computed(() => query.value.trim().length > 0);

  const totalCount = computed(() => results.value.length);

  const matchedIds = computed(() => {
    const ids = new Set<string>();
    for (const r of results.value) {
      if (r.date === selectedDate.value) ids.add(r.item.id);
    }
    return ids;
  });

  const otherDates = computed(() => {
    const buckets = new Map<string, number>();
    for (const r of results.value) {
      if (r.date === selectedDate.value) continue;
      buckets.set(r.date, (buckets.get(r.date) ?? 0) + 1);
    }
    return Array.from(buckets, ([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  });

  const totalOther = computed(() => {
    let n = 0;
    for (const { count } of otherDates.value) n += count;
    return n;
  });

  return { isSearchActive, matchedIds, otherDates, totalCount, totalOther };
}
