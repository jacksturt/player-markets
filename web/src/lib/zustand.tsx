import { create } from "zustand";

export enum CardView {
  FRONT = "front",
  BACK = "back",
}

interface FiltersState {
  activeFilters: string[];
  setActiveFilters: (filters: string[]) => void;
  bookmarkedPlayers: string[];
  setBookmarkedPlayers: (players: string[]) => void;
  showBookmarked: boolean;
  setShowBookmarked: (show: boolean) => void;
}

interface PlayerMarketCardState {
  activePlayerMarket: string;
  setActivePlayerMarket: (market: string) => void;
  selectedOrderType: "buy" | "sell";
  setSelectedOrderType: (orderType: "buy" | "sell") => void;
  cardView: CardView;
  setCardView: (cardView: CardView) => void;
}

export const useFiltersStore = create<FiltersState>()((set) => ({
  activeFilters: [],
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  bookmarkedPlayers: [],
  setBookmarkedPlayers: (players) => set({ bookmarkedPlayers: players }),
  showBookmarked: false,
  setShowBookmarked: (show) => set({ showBookmarked: show }),
}));

export const usePlayerMarketCardStore = create<PlayerMarketCardState>()(
  (set) => ({
    activePlayerMarket: "",
    setActivePlayerMarket: (market) => set({ activePlayerMarket: market }),
    selectedOrderType: "buy",
    setSelectedOrderType: (orderType) => set({ selectedOrderType: orderType }),
    cardView: CardView.FRONT,
    setCardView: (cardView) => set({ cardView }),
  })
);
