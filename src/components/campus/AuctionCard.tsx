import { Link } from "@tanstack/react-router";
import { Clock, Gavel } from "lucide-react";
import type { Auction } from "@/lib/data/types";
import { priceOf } from "@/lib/data/api";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "./Countdown";
import { PriceDisplay } from "./PriceDisplay";

export function AuctionCard({ auction }: { auction: Auction }) {
  return (
    <Link
      to="/auction/$id"
      params={{ id: auction.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={auction.photos[0]} alt={auction.title} loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <Badge variant="secondary" className="absolute left-3 top-3 bg-background/90">{auction.category}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-display text-base font-semibold">{auction.title}</h3>
          <p className="text-xs text-muted-foreground">{auction.condition} · {auction.pickup}</p>
        </div>
        <div className="mt-auto flex items-end justify-between">
          <PriceDisplay amount={priceOf(auction)} label={auction.currentBid ? "Leading bid" : "Starts at"} size="sm" />
          <div className="text-right text-xs">
            <div className="flex items-center justify-end gap-1 text-muted-foreground"><Gavel className="h-3 w-3" />{auction.bids.length} bids</div>
            <div className="flex items-center justify-end gap-1"><Clock className="h-3 w-3 text-muted-foreground" /><Countdown closesAt={auction.closesAt} /></div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function AuctionGrid({ items }: { items: Auction[] }) {
  if (!items.length) return <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No auctions match these filters.</p>;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((a) => <AuctionCard key={a.id} auction={a} />)}
    </div>
  );
}
