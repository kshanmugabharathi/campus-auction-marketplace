import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Auction } from "@/lib/data/types";
import { placeBid } from "@/lib/data/api";
import { inr, reportResult } from "@/lib/format";

export function BidConfirmDialog({
  auction, amount, open, onOpenChange,
}: { auction: Auction; amount: number; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm your bid</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div className="flex gap-3 rounded-xl border p-3">
                <img src={auction.photos[0]} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <div>
                  <div className="font-semibold text-foreground">{auction.title}</div>
                  <div className="text-sm">Your bid: <span className="font-display text-lg font-bold text-primary">{inr(amount)}</span></div>
                </div>
              </div>
              <p className="text-sm">Bids are binding. If you win and the seller approves, you agree to pay this amount at pickup ({auction.pickup}).</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={async (e) => {
            e.preventDefault(); setBusy(true);
            const result = await placeBid(auction.id, amount);
            reportResult(result, "Bid placed");
            if (result.ok) {
              // Refresh the auction detail, home feed, and browse list
              queryClient.invalidateQueries({ queryKey: ["auction", auction.id] });
              queryClient.invalidateQueries({ queryKey: ["home"] });
              queryClient.invalidateQueries({ queryKey: ["auctions"] });
              queryClient.invalidateQueries({ queryKey: ["buyer-dash"] });
            }
            setBusy(false); onOpenChange(false);
          }}>Yes, place {inr(amount)} bid</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
