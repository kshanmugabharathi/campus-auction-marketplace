import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <PageHeader title="Create a listing" subtitle="Set a fair starting price — juniors will take it from there." />
      <div className="rounded-3xl border bg-card p-6 shadow-card md:p-8">
        <ListingForm submitLabel="Publish auction" onSubmit={async (v) => {
          const result = await createListing(v);
          reportResult(result, "Auction published");
          if (result.ok) {
            queryClient.invalidateQueries({ queryKey: ["home"] });
            queryClient.invalidateQueries({ queryKey: ["auctions"] });
            queryClient.invalidateQueries({ queryKey: ["seller-dash"] });
            navigate({ to: "/seller" });
          }
        }} />
      </div>
    </div>
  );
}
