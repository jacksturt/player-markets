"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "@/styles/Markets.module.scss";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SettingsIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

// Props interface to pass settings to parent
interface TradeSettingsProps {
  onSettingsChange: (settings: { priority: string; slippage: string }) => void;
}

export function TradeSettings({ onSettingsChange }: TradeSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Initialize state from localStorage safely
  const [priority, setPriority] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tradePriority") || "Turbo";
    }
    return "Turbo";
  });

  const [slippage, setSlippage] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tradeSlippage") || "5";
    }
    return "5";
  });

  const [tempPriority, setTempPriority] = useState(priority);
  const [tempSlippage, setTempSlippage] = useState(slippage);

  // Handle settings updates
  const updateSettings = useCallback(
    (newPriority: string, newSlippage: string) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("tradePriority", newPriority);
        localStorage.setItem("tradeSlippage", newSlippage);
      }
      onSettingsChange({ priority: newPriority, slippage: newSlippage });
    },
    [onSettingsChange]
  );

  useEffect(() => {
    if (isOpen) {
      setTempPriority(priority);
      setTempSlippage(slippage);
    }
  }, [isOpen, priority, slippage]);

  const handlePriorityChange = (newPriority: string) => {
    setTempPriority(newPriority);
  };

  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setTempSlippage(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update actual states and localStorage only on save
    setPriority(tempPriority);
    setSlippage(tempSlippage);

    if (typeof window !== "undefined") {
      localStorage.setItem("tradePriority", tempPriority);
      localStorage.setItem("tradeSlippage", tempSlippage);
    }
    onSettingsChange({ priority: tempPriority, slippage: tempSlippage });
    setIsOpen(false);
  };

  return (
    <div className={styles.tradeSettingsContainer}>
      {!isOpen ? (
        <button
          className={styles.tradeSettingsButton}
          onClick={() => setIsOpen(true)}
        >
          <SettingsIcon />
        </button>
      ) : (
        <Card className="w-[270px] border-2 border-[#f2c1fb]">
          <CardHeader>
            <CardTitle>Transaction Settings</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-3">
                  <Label htmlFor="priority">Priority Fee Level</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={() => handlePriorityChange("Fast")}
                      className={
                        tempPriority === "Fast"
                          ? "flex-1 bg-[#f2c1fb] text-black hover:bg-[#f2c1fb]"
                          : "flex-1 bg-gray-200 hover:bg-[#f2c1fb]"
                      }
                    >
                      Fast
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handlePriorityChange("Turbo")}
                      className={
                        tempPriority === "Turbo"
                          ? "flex-1 bg-[#f2c1fb] text-black hover:bg-[#f2c1fb]"
                          : "flex-1 bg-gray-200 hover:bg-[#f2c1fb]"
                      }
                    >
                      Turbo
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handlePriorityChange("Ultra")}
                      className={
                        tempPriority === "Ultra"
                          ? "flex-1 bg-[#f2c1fb] text-black hover:bg-[#f2c1fb]"
                          : "flex-1 bg-gray-200 hover:bg-[#f2c1fb]"
                      }
                    >
                      Ultra
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col space-y-3">
                  <Label htmlFor="slippage">Slippage %</Label>
                  <Input
                    type="number"
                    id="slippage"
                    value={tempSlippage}
                    onChange={handleSlippageChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button className="hover:bg-[#f2c1fb]" type="submit">
                Save
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
