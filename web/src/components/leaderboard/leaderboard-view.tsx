"use client";

import React, { useState } from "react";
import LeaderboardTableItem from "./leaderboard-table-item";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "../ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ListFilter } from "lucide-react";

const filterOptions = [
  {
    label: "Popular Markets",
    value: "popular_markets",
  },
  {
    label: "Current Payout",
    value: "current_payout",
  },
  {
    label: "Fantasy Points",
    value: "fantasy_points",
  },
];

export default function LeaderboardView() {
  const [filter, setFilter] = useState("current_payout");
  return (
    <div className="w-full h-full flex items-start gap-[70px] px-[120px] pt-8">
      {/* super MVP table UI, can upgrade to tanstack table later for more features */}
      <div className="w-full flex flex-col gap-[15px]">
        <div className="flex items-center justify-between">
          <p className="text-2xl text-white font-clashMed">Leaderboard</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 bg-black/50 rounded-full h-[31px] px-3 py-2.5 border border-[#373737]/50 hover:bg-[#232323] hover:border-[#474747]"
              >
                <ListFilter size={16} className="text-[#CACACA]" />
                <p className="text-[#CACACA] font-clash text-[11px] leading-[11px]">
                  {
                    filterOptions.find((option) => option.value === filter)
                      ?.label
                  }
                </p>
                <ChevronDown size={16} className="text-[#CACACA]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black border border-[#373737]/50 text-white font-clash text-[11px] leading-[11px]">
              {filterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => {
                    setFilter(option.value);
                  }}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="w-full flex flex-col">
          {/* TODO: leaderboard.map */}
          <LeaderboardTableItem />
          <LeaderboardTableItem />
          <LeaderboardTableItem />
          <LeaderboardTableItem />
          <LeaderboardTableItem />
          <LeaderboardTableItem />
        </div>
      </div>
      <div className="flex flex-col gap-[25px]">
        <p className="text-2xl text-white font-clashMed">Popular Bets</p>
        <div className="w-[388px] bg-black/50 rounded-[30px] py-[25px] flex flex-col items-center gap-3">
          test
        </div>
      </div>
    </div>
  );
}
