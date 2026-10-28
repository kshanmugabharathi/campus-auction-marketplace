import { queryOptions } from "@tanstack/react-query";
import { getAuction, getBuyerDashboard, getHomeFeed, getSellerDashboard, getStudent, listAuctions } from "./api";
import type { AuctionFilters } from "./types";

/**
 * staleTime strategy:
 * - home / browse / auction detail: 30 seconds  (live marketplace data — refetch often)
 * - student profiles: 5 minutes  (rarely changes in a session)
 * - dashboards: 0  (always refetch; user expects fresh data on each visit)
 *
 * In SSR, every query returns mock data immediately (isServer guard in api.ts).
 * The client re-fetches from Supabase as soon as the query goes stale — which
 * is immediately for staleTime:0 queries and after 30 s for the others.
 */

export const homeFeedQuery = () =>
  queryOptions({ queryKey: ["home"], queryFn: getHomeFeed, staleTime: 30_000 });

export const auctionsQuery = (f: AuctionFilters) =>
  queryOptions({ queryKey: ["auctions", f], queryFn: () => listAuctions(f), staleTime: 30_000 });

export const auctionQuery = (id: string) =>
  queryOptions({ queryKey: ["auction", id], queryFn: () => getAuction(id), staleTime: 30_000 });

export const studentQuery = (id: string) =>
  queryOptions({ queryKey: ["student", id], queryFn: () => getStudent(id), staleTime: 5 * 60_000 });

export const sellerDashQuery = () =>
  queryOptions({ queryKey: ["seller-dash"], queryFn: getSellerDashboard, staleTime: 0 });

export const buyerDashQuery = () =>
  queryOptions({ queryKey: ["buyer-dash"], queryFn: getBuyerDashboard, staleTime: 0 });
