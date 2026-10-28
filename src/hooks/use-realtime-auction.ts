/**
 * useRealtimeAuction — subscribes to Supabase Realtime for new bids and
 * question answers on a single auction.
 *
 * When a new bid or question-answer row is detected, React Query's cache
 * for that auction is invalidated so the UI refetches automatically.
 *
 * Usage (in auction.$id.tsx):
 *   useRealtimeAuction(auctionId, queryClient);
 *
 * The hook is a no-op when the component unmounts (subscription is removed).
 */
import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useRealtimeAuction(auctionId: string, queryClient: QueryClient) {
  useEffect(() => {
    if (!auctionId) return;

    const channel = supabase
      .channel(`auction-${auctionId}`)
      // New bid placed on this auction
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `auction_id=eq.${auctionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["auction", auctionId] });
        },
      )
      // Auction current_bid or status updated (e.g. auto-close)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "auctions",
          filter: `id=eq.${auctionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["auction", auctionId] });
          // Also refresh home and browse feeds
          queryClient.invalidateQueries({ queryKey: ["home"] });
          queryClient.invalidateQueries({ queryKey: ["auctions"] });
        },
      )
      // Seller answered a question
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "questions",
          filter: `auction_id=eq.${auctionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["auction", auctionId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId, queryClient]);
}
