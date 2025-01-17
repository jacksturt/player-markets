import { create } from "zustand";

interface FiltersState {
  activeFilters: string[];
  setActiveFilters: (filters: string[]) => void;
  bookmarkedPlayers: string[];
  setBookmarkedPlayers: (players: string[]) => void;
  showBookmarked: boolean;
  setShowBookmarked: (show: boolean) => void;
}

export const useFiltersStore = create<FiltersState>()((set) => ({
  activeFilters: [],
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  bookmarkedPlayers: [],
  setBookmarkedPlayers: (players) => set({ bookmarkedPlayers: players }),
  showBookmarked: false,
  setShowBookmarked: (show) => set({ showBookmarked: show }),
}));
