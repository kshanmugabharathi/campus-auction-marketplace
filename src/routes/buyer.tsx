import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bell, Bookmark, Trophy } from "lucide-react";
import { buyerDashQuery } from "@/lib/data/queries";
import { inr } from "@/lib/format";
import { PageHeader } from "@/components/campus/AppShell";
import { Countdown } from "@/components/campus/Countdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/buyer")({
  head: () => ({
    meta: [
      { title: "My bids — CampusBid" },
      { name: "description", content: "Track your bids, wins, saved searches and notifications." },
      { property: "og:title", content: "My bids — CampusBid" },
      { property: "og:description", content: "Track your bids, wins, saved searches and notifications." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(buyerDashQuery()),
  component: Buyer,
});

function Buyer() {
  const { data } = useSuspenseQuery(buyerDashQuery());
  const unread = data.notifications.filter((n) => !n.read).length;
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <PageHeader title="My bids" subtitle="Sample buyer activity" />
      <Tabs defaultValue="bids">
        <TabsList className="flex-wrap">
          <TabsTrigger value="bids">Active bids</TabsTrigger>
          <TabsTrigger value="won">Won</TabsTrigger>
          <TabsTrigger value="saved">Saved searches</TabsTrigger>
          <TabsTrigger value="notif">Notifications {unread > 0 && <Badge className="ml-1 h-5 px-1.5">{unread}</Badge>}</TabsTrigger>
        </TabsList>
        <TabsContent value="bids" className="mt-4 space-y-3">
          {data.activeBids.map(({ auction: a, myMaxBid, autoBidLimit, status }) => (
            <Link key={a.id} to="/auction/$id" params={{ id: a.id }} className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4 hover:shadow-card">
              <img src={a.photos[0]} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{a.title}</div>
                <div className="text-sm text-muted-foreground">Your bid {inr(myMaxBid)} · Leading {inr(a.currentBid ?? a.startingPrice)} · <Countdown closesAt={a.closesAt} /></div>
                <div className="text-xs text-muted-foreground">Auto-bid limit: {autoBidLimit ? inr(autoBidLimit) : "Not set"}</div>
              </div>
              <Badge className={status === "leading" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>{status === "leading" ? "You're leading" : "Outbid"}</Badge>
            </Link>
          ))}
        </TabsContent>
        <TabsContent value="won" className="mt-4 space-y-3">
          {data.won.map((w) => (
            <div key={w.title} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
              <Trophy className="h-8 w-8 text-warning" />
              <div className="flex-1"><div className="font-semibold">{w.title}</div><div className="text-sm text-muted-foreground">from {w.seller} · {inr(w.price)}</div></div>
              <Badge variant="secondary">{w.status}</Badge>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="saved" className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.saved.map((s) => (
            <div key={s.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-2 font-semibold"><Bookmark className="h-4 w-4 text-primary" />{s.label}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.newMatches} new matches</p>
              <Button asChild size="sm" variant="outline" className="mt-3"><Link to="/browse" search={s.filters as never}>View matches</Link></Button>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="notif" className="mt-4 divide-y rounded-2xl border bg-card">
          {data.notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 p-4">
              <Bell className={`mt-0.5 h-4 w-4 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
              <div className="flex-1"><p className={n.read ? "text-muted-foreground" : "font-medium"}>{n.message}</p>
                <p className="text-xs text-muted-foreground">{n.minutesAgo < 60 ? `${n.minutesAgo} min ago` : n.minutesAgo < 1440 ? `${Math.round(n.minutesAgo / 60)} h ago` : "Yesterday"}</p></div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
