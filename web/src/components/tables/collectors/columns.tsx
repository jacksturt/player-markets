"use client";
import { ColumnDef } from "@tanstack/react-table";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Collector } from "@/types/table";
import Image from "next/image";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// const addWPProxy = (url: string): string => {
//   if (!url) return url;
//   if (url.startsWith("https://i0.wp.com/")) return url;
//   // Don't proxy local/default images
//   if (url.startsWith("/")) return url;
//   return `https://i0.wp.com/${url.replace(/^https?:\/\//, "")}`;
// };

// const getFallbackAvatarUrl = (username: string): string => {
//   return `https://source.boringavatars.com/beam/120/${encodeURIComponent(
//     username
//   )}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
// };

const columns: ColumnDef<Collector>[] = [
  {
    accessorKey: "username",
    header: "User",
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-center">
          {/* <Image
            src={addWPProxy(row.original.image)}
            alt={`${row.original.username}`}
            width={32}
            height={32}
            className="rounded-full mr-2"
            onError={(e: any) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getFallbackAvatarUrl(row.original.username);
            }}
          /> */}
          <Image
            src={row.original.image}
            alt={`${row.original.username}'s avatar`}
            width={32}
            height={32}
            className="rounded-full mr-2"
          />
          <span>{row.original.username}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "netWorth",
    header: ({ column }) => {
      return (
        <div className="flex items-center justify-center">
          <span
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Net Worth
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span onClick={(e) => e.stopPropagation()}>
                  <Info className="ml-2 h-4 w-4 hover:text-brandBg" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  <b>( buy price * amount )</b> of all bangers held
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <CaretSortIcon className="ml-1 h-4 w-4" />
        </div>
      );
    },
    cell: ({ row }) => <div>{row.getValue("netWorth")} SOL</div>,
    enableSorting: true,
  },
  {
    id: "volume",
    accessorKey: "volume.total",
    header: ({ column }) => {
      return (
        <div className="flex items-center justify-center">
          <span
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            24 Hour Volume
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span onClick={(e) => e.stopPropagation()}>
                  <Info className="ml-2 h-4 w-4 hover:text-brandBg" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  <b>total volume </b>of actions in the last 24 hours
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <CaretSortIcon className="ml-1 h-4 w-4" />
        </div>
      );
    },
    cell: ({ row }) => <div>{row.getValue("volume")} SOL</div>,
    enableSorting: true,
  },
  {
    accessorKey: "bangers",
    header: ({ column }) => {
      return (
        <div className="flex items-center justify-center">
          <span
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Bangers
          </span>
          <CaretSortIcon className="ml-1 h-4 w-4" />
        </div>
      );
    },
    enableSorting: true,
  },
];

export { columns };
