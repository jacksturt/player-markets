import { create } from "zustand";

interface FiltersState {
  activeFilters: string[];
  setActiveFilters: (filters: string[]) => void;
  bookmarkedPlayers: string[];
  setBookmarkedPlayers: (players: string[]) => void;
  showBookmarked: boolean;
  setShowBookmarked: (show: boolean) => void;
}

interface ActivePlayerMarketState {
  activePlayerMarket: string;
  setActivePlayerMarket: (market: string) => void;
}

export const useFiltersStore = create<FiltersState>()((set) => ({
  activeFilters: [],
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  bookmarkedPlayers: [],
  setBookmarkedPlayers: (players) => set({ bookmarkedPlayers: players }),
  showBookmarked: false,
  setShowBookmarked: (show) => set({ showBookmarked: show }),
}));

export const useActivePlayerMarketStore = create<ActivePlayerMarketState>()(
  (set) => ({
    activePlayerMarket: "",
    setActivePlayerMarket: (market) => set({ activePlayerMarket: market }),
  })
);
