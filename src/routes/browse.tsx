import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search } from "lucide-react";
import { auctionsQuery } from "@/lib/data/queries";
import type { AuctionFilters } from "@/lib/data/types";
import { AuctionGrid } from "@/components/campus/AuctionCard";
import { FilterPanel } from "@/components/campus/FilterPanel";
import { PageHeader } from "@/components/campus/AppShell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  closingSoon: z.boolean().optional(),
  sort: z.enum(["closing", "newest", "price-asc", "price-desc"]).optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: schema,
  head: () => ({
    meta: [
      { title: "Browse auctions — CampusBid" },
      { name: "description", content: "Filter campus auctions by category, condition, price and closing time." },
      { property: "og:title", content: "Browse auctions — CampusBid" },
      { property: "og:description", content: "Filter campus auctions by category, condition, price and closing time." },
    ],
  }),
  component: Browse,
});

function Browse() {
  const filters = Route.useSearch() as AuctionFilters;
  const navigate = useNavigate({ from: "/browse" });
  const { data, isLoading } = useQuery(auctionsQuery(filters));
  const update = (f: AuctionFilters) => navigate({ search: f as never, replace: true });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <PageHeader title="Browse auctions" subtitle={data ? `${data.length} live auctions` : "Loading…"} />
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-12 rounded-xl pl-11" placeholder="Search by keyword" value={filters.q ?? ""} onChange={(e) => update({ ...filters, q: e.target.value || undefined })} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside><FilterPanel filters={filters} onChange={update} /></aside>
        <div>
          {isLoading || !data ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
          ) : <AuctionGridWide items={data} />}
        </div>
      </div>
    </div>
  );
}

function AuctionGridWide({ items }: { items: Parameters<typeof AuctionGrid>[0]["items"] }) {
  return <div className="[&>div]:xl:grid-cols-3"><AuctionGrid items={items} /></div>;
}
