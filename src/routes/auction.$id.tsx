import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, MapPin, MessageCircle, Star, TrendingUp } from "lucide-react";
import { auctionQuery, studentQuery } from "@/lib/data/queries";
import { answerQuestion, askQuestion, isSelfBid, nextMinBid, setAutoBidLimit } from "@/lib/data/api";
import { inr, reportResult } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Countdown } from "@/components/campus/Countdown";
import { PriceDisplay } from "@/components/campus/PriceDisplay";
import { BidConfirmDialog } from "@/components/campus/BidConfirmDialog";
import { useRealtimeAuction } from "@/hooks/use-realtime-auction";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/auction/$id")({
  loader: async ({ context, params }) => {
    const a = await context.queryClient.ensureQueryData(auctionQuery(params.id));
    if (!a) throw notFound();
    return { title: a.title, description: a.description, image: a.photos[0] };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — CampusBid` },
          { name: "description", content: loaderData.description.slice(0, 150) },
          { property: "og:title", content: `${loaderData.title} — CampusBid` },
          { property: "og:description", content: loaderData.description.slice(0, 150) },
          { property: "og:image", content: loaderData.image },
          { name: "twitter:image", content: loaderData.image },
        ]
      : [{ title: "Auction unavailable — CampusBid" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Auction not found</h1>
      <Button asChild className="mt-6"><Link to="/browse">Browse auctions</Link></Button>
    </div>
  ),
  component: AuctionPage,
});

function AuctionPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: a } = useSuspenseQuery(auctionQuery(id));
  const { data: seller } = useQuery(studentQuery(a!.sellerId));
  const auction = a!;
  // True when the signed-in user is the seller of this listing — hides the bid
  // form and shows a notice instead. Enforced again in placeBid() and by a DB trigger.
  const isSeller = isSelfBid(auction, user?.id);
  const min = nextMinBid(auction);
  const [photo, setPhoto] = useState(0);
  const [amount, setAmount] = useState(String(min));
  const [autoLimit, setAutoLimit] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [question, setQuestion] = useState("");
  const amt = Number(amount);
  const bidError = !amt ? "Enter an amount" : amt < min ? `Minimum bid is ${inr(min)}` : null;
  const closed = auction.status !== "active";

  // Live bid and Q&A updates via Supabase Realtime
  useRealtimeAuction(id, queryClient);



  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      <Link to="/browse" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to auctions</Link>
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-3xl border bg-muted">
            <img src={auction.photos[photo]} alt={auction.title} className="h-full w-full object-cover" />
          </div>
          {auction.photos.length > 1 && (
            <div className="mt-3 flex gap-3">
              {auction.photos.map((p, i) => (
                <button key={p} onClick={() => setPhoto(i)} className={`h-20 w-20 overflow-hidden rounded-xl border-2 ${i === photo ? "border-primary" : "border-transparent"}`}>
                  <img src={p} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="mt-8 space-y-3">
            <h2 className="text-xl font-bold">About this item</h2>
            <p className="leading-relaxed text-muted-foreground">{auction.description}</p>
            <p className="flex items-center gap-1 text-sm"><MapPin className="h-4 w-4 text-primary" />Pickup: {auction.pickup}</p>
          </div>

          <div className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><MessageCircle className="h-5 w-5" />Questions & answers</h2>
            <div className="space-y-3">
              {auction.questions.length === 0 && <p className="text-sm text-muted-foreground">No questions yet.</p>}
              {auction.questions.map((q) => (
                <div key={q.id} className="rounded-2xl border p-4">
                  <p className="font-medium">Q: {q.question} <span className="text-xs font-normal text-muted-foreground">— {q.askedBy}</span></p>
                  {q.answer ? (
                    <p className="mt-1 text-sm text-muted-foreground">A: {q.answer}</p>
                  ) : isSeller ? (
                    <AnswerForm questionId={q.id} onAnswered={() => queryClient.invalidateQueries({ queryKey: ["auction", id] })} />
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Awaiting seller's answer</p>
                  )}
                </div>
              ))}
            </div>
            {!isSeller && (
              <form className="mt-4 flex gap-2" onSubmit={async (e) => {
                e.preventDefault();
                if (!question.trim()) return;
                const result = await askQuestion(auction.id, question);
                reportResult(result);
                if (result.ok) {
                  setQuestion("");
                  queryClient.invalidateQueries({ queryKey: ["auction", id] });
                }
              }}>
                <Textarea rows={1} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask the seller a question" />
                <Button type="submit" variant="outline">Ask</Button>
              </form>
            )}
            {isSeller && (
              <p className="mt-4 text-sm text-muted-foreground">
                You're the seller — use the <span className="font-medium">Answer</span> box on each question above. Your reply posts as the answer, not a new question.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border bg-card p-6 shadow-card">
            <div className="flex flex-wrap gap-2"><Badge>{auction.category}</Badge><Badge variant="secondary">{auction.condition}</Badge></div>
            <h1 className="mt-3 text-2xl font-bold md:text-3xl">{auction.title}</h1>
            <div className="mt-5 flex items-end justify-between gap-4">
              <PriceDisplay amount={auction.currentBid ?? auction.startingPrice} label={auction.currentBid ? "Current leading bid" : "No bids yet — starts at"} size="lg" />
              <div className="text-right text-sm text-muted-foreground">{auction.bids.length} bids</div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-muted p-4 text-sm">
              <div><dt className="text-muted-foreground">Starting price</dt><dd className="font-semibold">{inr(auction.startingPrice)}</dd></div>
              <div><dt className="text-muted-foreground">Min increment</dt><dd className="font-semibold">{inr(auction.minIncrement)}</dd></div>
            </dl>
            <div className="mt-5">
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Time left</div>
              <Countdown closesAt={auction.closesAt} large />
            </div>
            {/* ---- Bid section: hidden for the seller, shown for everyone else ---- */}
            {!closed && isSeller && (
              <div id="seller-no-bid-notice" className="mt-6 rounded-2xl border border-dashed border-muted-foreground/40 bg-muted px-5 py-4 text-sm text-muted-foreground">
                🏷️ <span className="font-medium">You cannot bid on your own listing.</span>
                <p className="mt-1 text-xs">Share this page so others can bid.</p>
              </div>
            )}
            {!closed && !isSeller && (
              <form id="bid-form" className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); if (!bidError) setConfirm(true); }}>
                <Label htmlFor="bid">Your bid (₹)</Label>
                <div className="flex gap-2">
                  <Input id="bid" type="number" className="h-12 text-lg" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <Button type="submit" size="lg" className="h-12 px-8">Bid</Button>
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map((k) => {
                    const v = min + auction.minIncrement * k;
                    return <button type="button" key={k} onClick={() => setAmount(String(v))} className="rounded-full border px-3 py-1 text-xs font-medium hover:border-primary hover:text-primary">{inr(v)}</button>;
                  })}
                </div>
                {bidError && amount && <p className="text-sm text-destructive">{bidError}</p>}
              </form>
            )}
            {!closed && !isSeller && (
              <form className="mt-5 border-t pt-5" onSubmit={async (e) => { e.preventDefault(); if (Number(autoLimit) >= min) reportResult(await setAutoBidLimit(auction.id, Number(autoLimit))); }}>
                <Label htmlFor="auto" className="flex items-center gap-1"><TrendingUp className="h-4 w-4" />Automatic bidding limit</Label>
                <p className="mb-2 text-xs text-muted-foreground">We'll outbid others by the minimum increment up to this amount.</p>
                <div className="flex gap-2">
                  <Input id="auto" type="number" placeholder={`e.g. ${min + auction.minIncrement * 5}`} value={autoLimit} onChange={(e) => setAutoLimit(e.target.value)} />
                  <Button variant="outline" type="submit">Set limit</Button>
                </div>
              </form>
            )}
          </div>

          {seller && (
            <div className="flex items-center gap-4 rounded-3xl border bg-card p-5">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-hero font-bold text-primary-foreground">{seller.avatar}</div>
              <div className="flex-1">
                <div className="font-semibold">{seller.name}</div>
                <div className="text-xs text-muted-foreground">{seller.batch} · {seller.hostel}, {seller.college}</div>
              </div>
              <div className="text-right text-sm"><div className="flex items-center gap-1 font-semibold"><Star className="h-4 w-4 fill-warning text-warning" />{seller.rating}</div><div className="text-xs text-muted-foreground">{seller.salesCount} sales</div></div>
            </div>
          )}

          <div className="rounded-3xl border bg-card p-5">
            <h3 className="mb-3 font-bold">Bid history</h3>
            {auction.bids.length === 0 ? <p className="text-sm text-muted-foreground">Be the first to bid.</p> : (
              <ul className="divide-y">
                {auction.bids.map((b, i) => (
                  <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="flex items-center gap-2">{b.bidderName}{i === 0 && <Badge className="bg-success text-success-foreground">Leading</Badge>}</span>
                    <span className="font-semibold tabular-nums">{inr(b.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <BidConfirmDialog auction={auction} amount={amt} open={confirm} onOpenChange={setConfirm} />
    </div>
  );
}

/** Inline answer box shown to the seller on an unanswered buyer question. */
function AnswerForm({ questionId, onAnswered }: { questionId: string; onAnswered: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim() || busy) return;
        setBusy(true);
        const result = await answerQuestion(questionId, text);
        reportResult(result, "Answer posted");
        if (result.ok) {
          setText("");
          onAnswered();
        }
        setBusy(false);
      }}
    >
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your answer…" className="h-9" />
      <Button type="submit" size="sm" variant="outline" disabled={busy || !text.trim()}>Answer</Button>
    </form>
  );
}
