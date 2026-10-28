import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/campus/AppShell";
import { ListingForm } from "@/components/campus/ListingForm";
import { auctionQuery } from "@/lib/data/queries";
import { updateListing } from "@/lib/data/api";
import { reportResult } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/listing/$id/edit")({
  loader: async ({ context, params }) => {
    const a = await context.queryClient.ensureQueryData(auctionQuery(params.id));
    if (!a) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Edit listing — CampusBid" },
      { name: "description", content: "Update your auction details." },
      { property: "og:title", content: "Edit listing — CampusBid" },
      { property: "og:description", content: "Update your auction details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Edit,
});

function Edit() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(auctionQuery(id));
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const a = data!;
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <PageHeader title="Edit listing" subtitle={a.title} action={<Button asChild variant="outline"><Link to="/seller">Back to dashboard</Link></Button>} />
      <div className="rounded-3xl border bg-card p-6 shadow-card md:p-8">
        <ListingForm initial={a} lockPricing={a.bids.length > 0} submitLabel="Save changes"
          onSubmit={async (v) => {
            const result = await updateListing(a.id, v);
            reportResult(result, "Listing updated");
            if (result.ok) {
              queryClient.invalidateQueries({ queryKey: ["auction", id] });
              queryClient.invalidateQueries({ queryKey: ["seller-dash"] });
              navigate({ to: "/seller" });
            }
          }} />
      </div>
    </div>
  );
}
