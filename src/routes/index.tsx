import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Search, ShieldCheck, Timer } from "lucide-react";
import { homeFeedQuery } from "@/lib/data/queries";
import { AuctionGrid } from "@/components/campus/AuctionCard";
import { CategoryChips } from "@/components/campus/FilterPanel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusBid — Campus auction marketplace" },
      { name: "description", content: "Bid on laptops, cycles, books and hostel essentials from graduating seniors." },
      { property: "og:title", content: "CampusBid — Campus auction marketplace" },
      { property: "og:description", content: "Bid on laptops, cycles, books and hostel essentials from graduating seniors." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeFeedQuery()),
  component: Home,
});

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold">{icon}{title}</h2>
        <Link to="/browse" className="flex items-center gap-1 text-sm font-semibold text-primary">View all <ArrowRight className="h-4 w-4" /></Link>
      </div>
      {children}
    </section>
  );
}

function Home() {
  const { data } = useSuspenseQuery(homeFeedQuery());
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <div className="relative overflow-hidden rounded-3xl bg-hero p-8 text-primary-foreground md:p-12">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium"><ShieldCheck className="h-3 w-3" /> Verified college emails only</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">Seniors are moving out.<br />Bid on their stuff.</h1>
          <p className="mt-3 text-primary-foreground/80">Laptops, cycles, books and hostel gear — auctioned by graduating students, picked up on campus.</p>
          <form className="mt-6 flex gap-2 rounded-2xl bg-background p-2" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/browse", search: { q } }); }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cycles, MacBook, GATE books…" className="border-0 pl-9 text-foreground shadow-none focus-visible:ring-0" />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <CategoryChips value="All" onChange={(c) => navigate({ to: "/browse", search: c === "All" ? {} : { category: c } })} />
      </div>

      <Section title="Featured auctions"><AuctionGrid items={data.featured} /></Section>
      <Section title="Closing soon" icon={<Timer className="h-6 w-6 text-destructive" />}><AuctionGrid items={data.closingSoon} /></Section>
      <Section title="Recently listed"><AuctionGrid items={data.recent} /></Section>
    </div>
  );
}
