"use client";
import { Input } from "../ui/input";
import { Loader2, Search } from "lucide-react";
import { debounce } from "lodash";
import { useCallback, useState } from "react";
import { RedisUserQuery } from "@/types/db-client";
import { searchRedisUsers } from "@/server/user";
import { useRouter } from "next-nprogress-bar";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { CreateMarketIndex } from "@/types/queries";
import { searchMarkets } from "@/server/markets";

function SearchComponent() {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<RedisUserQuery[]>([]);
  const [marketResults, setMarketResults] = useState<CreateMarketIndex[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounce the process of fetching search results
  const fetchSearchResults = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 3) {
        setSearchResults([])
        setMarketResults([])
        return
      }
      setSearchLoading(true);
      setSearchResults([]);
      setMarketResults([]);
      const [users, markets] = await Promise.all([
        searchRedisUsers(searchQuery),
        searchMarkets(searchQuery)
      ]);
      console.log("users", users);
      console.log("markets", markets);
      setSearchResults(users);
      setMarketResults(markets);
      setSearchLoading(false);
    }, 300),
    []
  ); // 300 ms debounce time

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearch(value);
    fetchSearchResults(value);
  };

  return (
    <div className="relative ml-auto flex-1 md:grow-0 mr-4">
      {!searchLoading && (
        <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
      )}
      {searchLoading && (
        <Loader2 className="absolute left-2.5 top-3 h-4 w-4 animate-spin" />
      )}
      <Input
        type="search"
        placeholder="Search Users or Markets"
        className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
        onChange={handleSearchChange}
        value={search}
      />
      {(searchResults.length > 0 || marketResults.length > 0) && (
        <div className="absolute top-full left-0 z-10 mt-2 w-full rounded-md bg-background shadow-lg overflow-hidden">
          {searchResults.map((user) => (
            <UserSearchResult user={user} key={user.twitterId} />
          ))}
          {marketResults.map((market) => (
            <MarketResult market={market} key={market.tweetId} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserSearchResult({ user }: { user: RedisUserQuery }) {
  const router = useRouter();
  return (
    <div
      className="px-4 py-2 bg-muted/50 hover:bg-muted cursor-pointer"
      onClick={() => router.push(`/${user.username}`)}
    >
      <div className="flex items-center">
        <Avatar className="w-8 h-8 mr-2">
          <AvatarImage src={user.image} />
          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </div>
    </div>
  );
}

function MarketResult({ market }: { market: CreateMarketIndex }) {
  const router = useRouter();
  return (
    <div
      className="px-4 py-2 bg-muted/50 hover:bg-muted cursor-pointer"
      onClick={() => router.push(`/markets/${market.tweetId}`)}
    >
      <div className="flex items-center">
        <div className="w-8 mr-4">
          <img src={market.imageUrl} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium">{market.text}</p>
          <p className="text-sm text-muted-foreground">{market.author.name} {"|"} @{market.author.username}</p>
        </div>
      </div>
    </div>
  );
}

export { SearchComponent };