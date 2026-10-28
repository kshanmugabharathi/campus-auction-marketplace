import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/campus/AppShell";
import { ListingForm } from "@/components/campus/ListingForm";
import { createListing } from "@/lib/data/api";
import { reportResult } from "@/lib/format";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Create a listing — CampusBid" },
      { name: "description", content: "Auction your used items to juniors before you graduate." },
      { property: "og:title", content: "Create a listing — CampusBid" },
      { property: "og:description", content: "Auction your used items to juniors before you graduate." },
    ],
  }),
  component: Sell,
});

function Sell() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <PageHeader title="Create a listing" subtitle="Set a fair starting price — juniors will take it from there." />
      <div className="rounded-3xl border bg-card p-6 shadow-card md:p-8">
        <ListingForm submitLabel="Publish auction" onSubmit={async (v) => reportResult(await createListing(v), "Auction published")} />
      </div>
    </div>
  );
}
