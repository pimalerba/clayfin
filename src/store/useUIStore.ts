import { create } from 'zustand';
import { getCurrentMonthISO } from '@/utils/date';
import { TransactionType } from '@/types';

export type FilterTransactionType = 'all' | TransactionType;

interface UIStoreState {
  selectedMonth: string; // yyyy-MM
  filterType: FilterTransactionType;
  filterCategoryId: string | null;
  searchQuery: string;
  setSelectedMonth: (month: string) => void;
  setFilterType: (type: FilterTransactionType) => void;
  setFilterCategoryId: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;
  resetTransactionFilters: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  selectedMonth: getCurrentMonthISO(),
  filterType: 'all',
  filterCategoryId: null,
  searchQuery: '',
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setFilterType: (filterType) => set({ filterType, filterCategoryId: null }),
  setFilterCategoryId: (filterCategoryId) => set({ filterCategoryId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  resetTransactionFilters: () =>
    set({
      filterType: 'all',
      filterCategoryId: null,
      searchQuery: '',
    }),
}));
