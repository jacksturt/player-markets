import clsx from "clsx";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getTrending } from "@/server/markets";
import { TrendingMarket } from "@/types/queries";
import { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Loader2 } from "lucide-react";


function Trending() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [markets, setTrendingMarkets] = useState<TrendingMarket[]>([]);

  useEffect(() => {
    async function fetchTrending() {
      const markets = await getTrending(5);
      setTrendingMarkets(markets);
      setIsLoading(false);
    }
    fetchTrending();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return markets.length > 0 ? (
    <div className="flex w-full flex-col">
      <div className="flex items-center justify-center border-b py-4 text-2xl font-bold">
        Trending
      </div>
      <div>
        <Carousel>
          <CarouselContent>
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card>
                    <CardContent className="flex aspect-square items-center justify-center p-6">
                      <span className="text-4xl font-semibold">{index + 1}</span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  ) : (
    <div className="flex h-full w-full items-center justify-center">
      No Bangers Currently Trending
    </div>
  );
}

export default Trending;