import { create } from "zustand";

export type DateRange = {
  from: Date | null;
  to: Date | null;
};

type FiltersState = {
  search: string;
  status: string;
  dateRange: DateRange;
  setSearch: (search: string) => void;
  setStatus: (status: string) => void;
  setDateRange: (range: DateRange) => void;
  resetFilters: () => void;
};

const initialDateRange: DateRange = { from: null, to: null };

export const useFiltersStore = create<FiltersState>((set) => ({
  search: "",
  status: "",
  dateRange: initialDateRange,
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  setDateRange: (range) => set({ dateRange: range }),
  resetFilters: () =>
    set({
      search: "",
      status: "",
      dateRange: initialDateRange,
    }),
}));
