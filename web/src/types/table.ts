import { Prisma } from "@prisma/client";

interface Volume {
  total: number;
  hours: number;
}

interface Collector {
  image: string;
  username: string;
  netWorth: number;
  volume: Volume;
  bangers: number;
}

interface CreatorRaw {
  image: string;
  username: string;
  marketcap: Prisma.Decimal;
  volume: Volume;
  holders: Prisma.Decimal;
}

interface Creator {
  image: string;
  username: string;
  marketCap: number;
  volume: Volume;
  holders: number;
}

export type { CreatorRaw, Creator, Collector, Volume };
