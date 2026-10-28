import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { sellerDashQuery } from "@/lib/data/queries";
import { cancelListing, decideWinningPrice, priceOf } from "@/lib/data/api";
import type { SaleOutcome } from "@/lib/data/types";
import { inr, reportResult } from "@/lib/format";
import { PageHeader } from "@/components/campus/AppShell";
import { Countdown } from "@/components/campus/Countdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/seller")({
  head: () => ({
    meta: [
      { title: "Seller dashboard — CampusBid" },
      { name: "description", content: "Manage your active auctions, winners and sale outcomes." },
      { property: "og:title", content: "Seller dashboard — CampusBid" },
      { property: "og:description", content: "Manage your active auctions, winners and sale outcomes." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sellerDashQuery()),
  component: Seller,
});

const outcomeLabel: Record<SaleOutcome, [string, string]> = {
  pending_approval: ["Awaiting your approval", "bg-warning text-warning-foreground"],
  approved: ["Approved", "bg-success text-success-foreground"],
  rejected: ["Rejected", "bg-destructive text-destructive-foreground"],
  completed: ["Sold & collected", "bg-success text-success-foreground"],
};

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-sm text-muted-foreground">{label}</div><div className="mt-1 font-display text-2xl font-bold">{value}</div></div>;
}

function Seller() {
  const { data } = useSuspenseQuery(sellerDashQuery());
  const [busyId, setBusyId] = useState<string | null>(null);
  const decide = async (id: string, approve: boolean) => { setBusyId(id); reportResult(await decideWinningPrice(id, approve)); setBusyId(null); };
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <PageHeader title="Seller dashboard" subtitle="Sample data for Aarav Sharma, Kumaon Hostel"
        action={<Button asChild><Link to="/sell"><Plus className="h-4 w-4" />New listing</Link></Button>} />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Active auctions" value={String(data.active.length)} />
        <Stat label="Leading bids total" value={inr(data.active.reduce((s, a) => s + (a.currentBid ?? 0), 0))} />
        <Stat label="Closed auctions" value={String(data.closed.length)} />
      </div>
      <Tabs defaultValue="active">
        <TabsList><TabsTrigger value="active">Active</TabsTrigger><TabsTrigger value="closed">Closed & winners</TabsTrigger></TabsList>
        <TabsContent value="active" className="mt-4 space-y-3">
          {data.active.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4">
              <img src={a.photos[0]} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <Link to="/auction/$id" params={{ id: a.id }} className="font-semibold hover:text-primary">{a.title}</Link>
                <div className="text-sm text-muted-foreground">{a.bids.length} bids · {a.currentBid ? "Leading" : "Starting"} {inr(priceOf(a))} · closes in <Countdown closesAt={a.closesAt} /></div>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm"><Link to="/listing/$id/edit" params={{ id: a.id }}><Pencil className="h-4 w-4" />Edit</Link></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive">Cancel</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Cancel this auction?</AlertDialogTitle>
                      <AlertDialogDescription>All {a.bids.length} bidders will be notified and their bids voided.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Keep it</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => reportResult(await cancelListing(a.id))}>Cancel auction</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="closed" className="mt-4 space-y-3">
          {data.closed.map(({ auction: a, provisionalWinner, winningPrice, outcome }) => {
            const [label, cls] = outcomeLabel[outcome];
            return (
              <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4">
                <img src={a.photos[0]} alt="" className="h-16 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-sm text-muted-foreground">Provisional winner: <span className="font-medium text-foreground">{provisionalWinner ?? "No bids"}</span>{winningPrice && <> at <span className="font-semibold text-foreground">{inr(winningPrice)}</span></>}</div>
                </div>
                <Badge className={cls}>{label}</Badge>
                {outcome === "pending_approval" && (
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busyId === a.id} onClick={() => decide(a.id, true)}><Check className="h-4 w-4" />Approve price</Button>
                    <Button size="sm" variant="outline" disabled={busyId === a.id} onClick={() => decide(a.id, false)}><X className="h-4 w-4" />Reject</Button>
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
