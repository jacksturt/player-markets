"use client";

import { Bookmark } from "lucide-react";
import { NFL_POSITIONS } from "@/lib/constants";
import { useFiltersStore } from "@/lib/zustand";

export default function Filters() {
  const { activeFilters, setActiveFilters, showBookmarked, setShowBookmarked } =
    useFiltersStore();
  return (
    <div className="flex justify-center items-center gap-2">
      {Object.keys(NFL_POSITIONS).map((option) => (
        <button
          className={`text-[10px] px-4 py-1 rounded-full ${
            activeFilters.includes(option) && !showBookmarked
              ? "bg-[#000] text-white"
              : "bg-[#D9D9D9]"
          }`}
          key={option}
          onClick={() => {
            if (showBookmarked) {
              setShowBookmarked(false);
              setActiveFilters([option]);
            } else {
              if (activeFilters.includes(option)) {
                setActiveFilters(
                  activeFilters.filter((filter) => filter !== option)
                );
              } else {
                setActiveFilters([...activeFilters, option]);
              }
            }
          }}
        >
          {option}
        </button>
      ))}
      <button
        className="ml-2"
        onClick={() => {
          setShowBookmarked(!showBookmarked);
          setActiveFilters([]);
        }}
      >
        <Bookmark
          size={20}
          strokeWidth={1}
          fill={showBookmarked ? "#000" : "#D9D9D9"}
        />
      </button>
    </div>
  );
}
