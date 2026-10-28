/**
 * Data-access layer. Every page reads/writes through these functions only.
 * Reads currently come from in-memory mock data; writes report that the
 * backend is not connected. Swap the implementations for backend queries later
 * without touching components.
 */
import { auctions, demoUserId, notifications, students } from "./mock";
import type {
  Auction,
  AuctionFilters,
  BuyerBid,
  MutationResult,
  SavedSearch,
  SellerClosedAuction,
  Student,
} from "./types";

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));
const notConnected = (action: string): MutationResult => ({
  ok: false,
  reason: "backend_not_connected",
  message: `${action} needs the live backend, which isn't connected yet. Nothing was saved.`,
});

export const CATEGORIES = ["Electronics", "Books", "Furniture", "Cycles", "Instruments", "Hostel Essentials", "Sports"] as const;
export const CONDITIONS = ["Like New", "Good", "Fair", "Well Used"] as const;

export const priceOf = (a: Auction) => a.currentBid ?? a.startingPrice;
export const nextMinBid = (a: Auction) => (a.currentBid ? a.currentBid + a.minIncrement : a.startingPrice);

export function filterAuctions(list: Auction[], f: AuctionFilters): Auction[] {
  const q = f.q?.trim().toLowerCase();
  let out = list.filter((a) => a.status === "active");
  if (q) out = out.filter((a) => `${a.title} ${a.description} ${a.category}`.toLowerCase().includes(q));
  if (f.category && f.category !== "All") out = out.filter((a) => a.category === f.category);
  if (f.condition && f.condition !== "Any") out = out.filter((a) => a.condition === f.condition);
  if (f.minPrice != null) out = out.filter((a) => priceOf(a) >= f.minPrice!);
  if (f.maxPrice != null) out = out.filter((a) => priceOf(a) <= f.maxPrice!);
  if (f.closingSoon) out = out.filter((a) => new Date(a.closesAt).getTime() - Date.now() < 12 * 3600_000);
  const sort = f.sort ?? "closing";
  const t = (a: Auction, k: "closesAt" | "createdAt") => new Date(a[k]).getTime();
  out = [...out].sort((a, b) =>
    sort === "newest" ? t(b, "createdAt") - t(a, "createdAt")
    : sort === "price-asc" ? priceOf(a) - priceOf(b)
    : sort === "price-desc" ? priceOf(b) - priceOf(a)
    : t(a, "closesAt") - t(b, "closesAt"),
  );
  return out;
}

export const listAuctions = (f: AuctionFilters = {}) => delay(filterAuctions(auctions, f));
export const getAuction = (id: string) => delay(auctions.find((a) => a.id === id) ?? null);
export const getStudent = (id: string) => delay<Student | null>(students.find((s) => s.id === id) ?? null);
export const getSellerName = (id: string) => students.find((s) => s.id === id)?.name ?? "Student";

export async function getHomeFeed() {
  const active = filterAuctions(auctions, {});
  return delay({
    featured: active.filter((a) => a.featured).slice(0, 4),
    recent: filterAuctions(auctions, { sort: "newest" }).slice(0, 8),
    closingSoon: filterAuctions(auctions, { closingSoon: true }).slice(0, 4),
  });
}

export async function getSellerDashboard() {
  const mine = auctions.filter((a) => a.sellerId === demoUserId);
  const closed: SellerClosedAuction[] = mine
    .filter((a) => a.status === "closed")
    .map((a, i) => ({
      auction: a,
      provisionalWinner: a.bids[0]?.bidderName ?? null,
      winningPrice: a.currentBid,
      outcome: i === 0 ? "pending_approval" : "completed",
    }));
  return delay({ active: mine.filter((a) => a.status === "active"), closed });
}

export async function getBuyerDashboard() {
  const pick = (id: string) => auctions.find((a) => a.id === id)!;
  const activeBids: BuyerBid[] = [
    { auction: pick("a4"), myMaxBid: 24000, autoBidLimit: 26000, status: "outbid" },
    { auction: pick("a2"), myMaxBid: 3800, autoBidLimit: null, status: "leading" },
    { auction: pick("a7"), myMaxBid: 12250, autoBidLimit: 14000, status: "outbid" },
  ];
  const won = [{ title: "Prestige Electric Kettle 1.5L", price: 650, seller: "Priya Iyer", status: "Awaiting seller approval" },
    { title: "Wildcraft Laptop Backpack", price: 900, seller: "Rohan Mehta", status: "Collected" }];
  const saved: SavedSearch[] = [
    { id: "ss1", label: "Books under ₹1,500", filters: { category: "Books", maxPrice: 1500 }, newMatches: 3 },
    { id: "ss2", label: "Cycles closing soon", filters: { category: "Cycles", closingSoon: true }, newMatches: 1 },
  ];
  return delay({ activeBids, won, saved, notifications });
}

// ---- Writes: not available until the backend is connected ----
export const placeBid = async (_auctionId: string, _amount: number) => delay(notConnected("Placing a bid"));
export const setAutoBidLimit = async (_auctionId: string, _limit: number) => delay(notConnected("Setting an auto-bid limit"));
export const createListing = async (_data: unknown) => delay(notConnected("Publishing a listing"));
export const updateListing = async (_id: string, _data: unknown) => delay(notConnected("Saving listing changes"));
export const cancelListing = async (_id: string) => delay(notConnected("Cancelling an auction"));
export const decideWinningPrice = async (_id: string, _approve: boolean) => delay(notConnected("Approving or rejecting a sale"));
export const askQuestion = async (_id: string, _q: string) => delay(notConnected("Posting a question"));
export const signIn = async (_email: string, _password: string) => delay(notConnected("Signing in"));
export const signUp = async (_data: unknown) => delay(notConnected("Creating an account"));
