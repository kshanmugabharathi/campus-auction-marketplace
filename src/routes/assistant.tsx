import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { CATEGORIES, listAuctions, nextMinBid, priceOf } from "@/lib/data/api";
import type { Auction, AuctionFilters } from "@/lib/data/types";
import { inr } from "@/lib/format";
import { PageHeader } from "@/components/campus/AppShell";
import { BidConfirmDialog } from "@/components/campus/BidConfirmDialog";
import { Countdown } from "@/components/campus/Countdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI shopping assistant — CampusBid" },
      { name: "description", content: "Describe what you need and find matching campus auctions." },
      { property: "og:title", content: "AI shopping assistant — CampusBid" },
      { property: "og:description", content: "Describe what you need and find matching campus auctions." },
    ],
  }),
  component: Assistant,
});

type Msg = { role: "user" | "assistant"; text: string; results?: Auction[] };

const STOP = new Set(["i", "need", "want", "a", "an", "the", "for", "under", "below", "me", "find", "show", "some", "any", "looking", "cheap", "rs", "with", "and", "to", "my", "in"]);

/** Interim matcher until the AI model is connected: extracts budget, category and keywords. */
function parse(text: string): AuctionFilters & { words: string[] } {
  const t = text.toLowerCase();
  const budget = t.match(/(?:under|below|less than|max|upto|up to)\s*(?:₹|rs\.?)?\s*([\d,]+)\s*(k)?/);
  const maxPrice = budget ? Number(budget[1].replace(/,/g, "")) * (budget[2] ? 1000 : 1) : undefined;
  const category = CATEGORIES.find((c) => t.includes(c.toLowerCase().split(" ")[0].replace(/s$/, "")));
  const words = t.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w) && !/^\d/.test(w));
  return { maxPrice, category, closingSoon: /soon|today|urgent/.test(t), words };
}

function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: "Hi! Tell me what you're looking for — e.g. “a cycle under ₹4000” or “headphones closing soon”. I'll find auctions, and I'll always ask you to confirm before any bid." },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<{ a: Auction; amount: number } | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim(); if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    const { words, ...f } = parse(text);
    let results = await listAuctions(f);
    if (words.length && !f.category) {
      const hits = results.filter((a) => words.some((w) => `${a.title} ${a.description} ${a.category}`.toLowerCase().includes(w)));
      results = hits;
    }
    setMsgs((m) => [...m, {
      role: "assistant",
      text: results.length ? `I found ${results.length} matching auction${results.length > 1 ? "s" : ""}${f.maxPrice ? ` within ${inr(f.maxPrice)}` : ""}.` : "I couldn't find a match. Try a broader description or a higher budget.",
      results: results.slice(0, 4),
    }]);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <PageHeader title="AI assistant" subtitle="Search by describing what you need." />
      <div className="mb-4 rounded-xl bg-accent px-4 py-2 text-xs text-accent-foreground">
        Preview: replies use simple keyword and budget matching on sample listings. The conversational AI model connects with the backend.
      </div>
      <div className="space-y-4 rounded-3xl border bg-card p-4 shadow-card md:p-6">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex gap-3"}>
            {m.role === "assistant" && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-hero text-primary-foreground"><Sparkles className="h-4 w-4" /></span>}
            <div className={`max-w-[85%] space-y-3 rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <p>{m.text}</p>
              {m.results?.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border bg-background p-2">
                  <img src={a.photos[0]} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link to="/auction/$id" params={{ id: a.id }} className="line-clamp-1 font-semibold hover:text-primary">{a.title}</Link>
                    <div className="text-xs text-muted-foreground">{inr(priceOf(a))} · <Countdown closesAt={a.closesAt} /></div>
                  </div>
                  <Button size="sm" onClick={() => setPending({ a, amount: nextMinBid(a) })}>Bid {inr(nextMinBid(a))}</Button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <form onSubmit={send} className="flex gap-2 border-t pt-4">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="I need a study table under ₹3000…" />
          <Button type="submit" size="icon" aria-label="Send"><Send className="h-4 w-4" /></Button>
        </form>
      </div>
      {pending && <BidConfirmDialog auction={pending.a} amount={pending.amount} open onOpenChange={(o) => !o && setPending(null)} />}
    </div>
  );
}
