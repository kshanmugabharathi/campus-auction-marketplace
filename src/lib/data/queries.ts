import { queryOptions } from "@tanstack/react-query";
import { getAuction, getBuyerDashboard, getHomeFeed, getSellerDashboard, getStudent, listAuctions } from "./api";
import type { AuctionFilters } from "./types";

export const homeFeedQuery = () => queryOptions({ queryKey: ["home"], queryFn: getHomeFeed });
export const auctionsQuery = (f: AuctionFilters) => queryOptions({ queryKey: ["auctions", f], queryFn: () => listAuctions(f) });
export const auctionQuery = (id: string) => queryOptions({ queryKey: ["auction", id], queryFn: () => getAuction(id) });
export const studentQuery = (id: string) => queryOptions({ queryKey: ["student", id], queryFn: () => getStudent(id) });
export const sellerDashQuery = () => queryOptions({ queryKey: ["seller-dash"], queryFn: getSellerDashboard });
export const buyerDashQuery = () => queryOptions({ queryKey: ["buyer-dash"], queryFn: getBuyerDashboard });
