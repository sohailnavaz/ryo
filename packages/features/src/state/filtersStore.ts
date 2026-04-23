import { create } from 'zustand';
import type { SearchFilters } from '@bnb/api';
import { EMPTY_FILTERS } from '@bnb/api';

type State = {
  filters: SearchFilters;
  setFilters: (patch: Partial<SearchFilters>) => void;
  reset: () => void;
};

export const useFiltersStore = create<State>((set) => ({
  filters: EMPTY_FILTERS,
  setFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch } })),
  reset: () => set({ filters: EMPTY_FILTERS }),
}));
