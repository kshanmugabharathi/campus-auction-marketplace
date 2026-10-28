/**
 * Data-access layer — the single seam between the UI and the backend.
 *
 * Every page reads/writes through these functions only; components never
 * import from mock.ts or supabase.ts directly.
 *
 * Read functions:
 *  - In SSR (server-side), return mock data immediately. The server-rendered
 *    HTML is replaced by the real Supabase fetch on the client once the page
 *    hydrates. This avoids all SSR ↔ Supabase incompatibilities.
 *  - In the browser, query Supabase first and fall back to mock on any error
 *    (including missing tables before the schema is applied).
 *
 * Write functions use Supabase and return MutationResult. They require the
 * user to be authenticated; if not they return ok:false with a clear message.
 */

import { supabase } from "../supabase";
import {
  auctions as mockAuctions,
  demoUserId,
  notifications as mockNotifications,
  students as mockStudents,
} from "./mock";
import type {
  Auction,
  AuctionFilters,
  Bid,
  BuyerBid,
  MutationResult,
  Question,
  SaleOutcome,
  SavedSearch,
  SellerClosedAuction,
  Student,
} from "./types";

// ---- Helpers ----

/** True when running in the SSR (Node/Nitro) environment. */
const isServer = typeof window === "undefined";

/**
 * Safely call Supabase. Catches both:
 * - Returned `error` objects (PostgREST / auth errors)
 * - Thrown exceptions (network failures, fetch errors in SSR)
 * Returns `null` on any failure so callers can fall back to mock.
 */
async function safeQuery<T>(
  fn: () => PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T | null> {
  try {
    const { data, error } = await fn();
    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.warn("[CampusBid] Supabase query error:", (error as any)?.message ?? error);
      return null;
    }
    return data;
  } catch (e) {
    console.warn("[CampusBid] Supabase threw unexpectedly:", e);
    return null;
  }
}

// ---- Exported constants ----

export const CATEGORIES = [
  "Electronics",
  "Books",
  "Furniture",
  "Cycles",
  "Instruments",
  "Hostel Essentials",
  "Sports",
] as const;

export const CONDITIONS = ["Like New", "Good", "Fair", "Well Used"] as const;

// ---- Pure helpers (no network; used by components and AI assistant) ----

export const priceOf = (a: Auction) => a.currentBid ?? a.startingPrice;
export const nextMinBid = (a: Auction) =>
  a.currentBid ? a.currentBid + a.minIncrement : a.startingPrice;

/**
 * Returns true when the given userId is the seller of the auction.
 * Used by the bid form (frontend guard) and testable in isolation.
 */
export const isSelfBid = (a: Auction, userId: string | null | undefined): boolean =>
  !!userId && userId === a.sellerId;

// ---- Row mappers: DB snake_case → app camelCase ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAuction(row: any): Auction {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    condition: row.condition,
    description: row.description,
    photos: row.photos ?? [],
    startingPrice: row.starting_price,
    minIncrement: row.min_increment,
    currentBid: row.current_bid ?? null,
    sellerId: row.seller_id,
    createdAt: row.created_at,
    closesAt: row.closes_at,
    status: row.status,
    featured: row.featured ?? false,
    pickup: row.pickup ?? "",
    // Sort bids descending so bids[0] is always the leader
    bids: ((row.bids ?? []) as any[]).map(rowToBid).sort((a, b) => b.amount - a.amount),
    questions: ((row.questions ?? []) as any[]).map(rowToQuestion),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBid(row: any): Bid {
  return {
    id: row.id,
    bidderName: row.bidder_name,
    amount: row.amount,
    placedAt: row.placed_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToQuestion(row: any): Question {
  return {
    id: row.id,
    askedBy: row.asked_by,
    question: row.question,
    answer: row.answer ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStudent(row: any): Student {
  return {
    id: row.id,
    name: row.name,
    college: row.college ?? "",
    hostel: row.hostel ?? "",
    batch: row.batch ?? "",
    avatar: row.avatar ?? "",
    rating: Number(row.rating),
    salesCount: row.sales_count ?? 0,
  };
}

// ---- Client-side filter (kept for AI assistant + mock fallback) ----

export function filterAuctions(list: Auction[], f: AuctionFilters): Auction[] {
  const q = f.q?.trim().toLowerCase();
  let out = list.filter((a) => a.status === "active");
  if (q) out = out.filter((a) => `${a.title} ${a.description} ${a.category}`.toLowerCase().includes(q));
  if (f.category && f.category !== "All") out = out.filter((a) => a.category === f.category);
  if (f.condition && f.condition !== "Any") out = out.filter((a) => a.condition === f.condition);
  if (f.minPrice != null) out = out.filter((a) => priceOf(a) >= f.minPrice!);
  if (f.maxPrice != null) out = out.filter((a) => priceOf(a) <= f.maxPrice!);
  if (f.closingSoon)
    out = out.filter((a) => new Date(a.closesAt).getTime() - Date.now() < 12 * 3600_000);
  const sort = f.sort ?? "closing";
  const t = (a: Auction, k: "closesAt" | "createdAt") => new Date(a[k]).getTime();
  out = [...out].sort((a, b) =>
    sort === "newest"
      ? t(b, "createdAt") - t(a, "createdAt")
      : sort === "price-asc"
        ? priceOf(a) - priceOf(b)
        : sort === "price-desc"
          ? priceOf(b) - priceOf(a)
          : t(a, "closesAt") - t(b, "closesAt"),
  );
  return out;
}

// ============================================================
// READ functions
// ============================================================

export async function listAuctions(f: AuctionFilters = {}): Promise<Auction[]> {
  // Always use mock in SSR; client will refetch against Supabase after hydration
  if (isServer) return filterAuctions(mockAuctions, f);

  let query = supabase
    .from("auctions")
    .select("*, bids(*), questions(*)")
    .eq("status", "active");

  if (f.q?.trim()) {
    const term = f.q.trim();
    query = query.or(
      `title.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`,
    );
  }
  if (f.category && f.category !== "All") query = query.eq("category", f.category);
  if (f.condition && f.condition !== "Any") query = query.eq("condition", f.condition);
  if (f.closingSoon) {
    query = query.lt("closes_at", new Date(Date.now() + 12 * 3600_000).toISOString());
  }

  const sort = f.sort ?? "closing";
  if (sort === "newest") query = query.order("created_at", { ascending: false });
  else if (sort === "price-asc")
    query = query.order("current_bid", { ascending: true, nullsFirst: false });
  else if (sort === "price-desc")
    query = query.order("current_bid", { ascending: false, nullsFirst: false });
  else query = query.order("closes_at", { ascending: true });

  const data = await safeQuery(() => query);
  if (!data) return filterAuctions(mockAuctions, f);

  let result = data.map(rowToAuction);
  // Price filters applied client-side: PostgREST can't coalesce current_bid ?? starting_price easily
  if (f.minPrice != null) result = result.filter((a) => priceOf(a) >= f.minPrice!);
  if (f.maxPrice != null) result = result.filter((a) => priceOf(a) <= f.maxPrice!);
  return result;
}

export async function getAuction(id: string): Promise<Auction | null> {
  if (isServer) return mockAuctions.find((a) => a.id === id) ?? null;

  const data = await safeQuery(() =>
    supabase
      .from("auctions")
      .select("*, bids(*), questions(*)")
      .eq("id", id)
      .maybeSingle(),
  );
  if (data === null) {
    // If null could be "not found" or "error". For error case, show mock.
    // For not found, getAuction returns null → caller throws notFound().
    const fromMock = mockAuctions.find((a) => a.id === id);
    return fromMock ?? null;
  }
  return rowToAuction(data);
}

export async function getStudent(id: string): Promise<Student | null> {
  if (isServer) return mockStudents.find((s) => s.id === id) ?? null;

  const data = await safeQuery(() =>
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
  );
  if (!data) return mockStudents.find((s) => s.id === id) ?? null;
  return rowToStudent(data);
}

/** Synchronous display-name lookup (used only in a few non-async display spots). */
export function getSellerName(id: string): string {
  return mockStudents.find((s) => s.id === id)?.name ?? "Student";
}

export async function getHomeFeed() {
  if (isServer) return _mockHomeFeed();

  const data = await safeQuery(() =>
    supabase
      .from("auctions")
      .select("*, bids(*), questions(*)")
      .eq("status", "active"),
  );
  if (!data) return _mockHomeFeed();

  const rows = data.map(rowToAuction);
  const now = Date.now();
  return {
    featured: rows.filter((a) => a.featured).slice(0, 4),
    recent: [...rows]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8),
    closingSoon: rows
      .filter((a) => new Date(a.closesAt).getTime() - now < 12 * 3600_000)
      .sort((a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime())
      .slice(0, 4),
  };
}

export async function getSellerDashboard() {
  if (isServer) return _mockSellerDashboard();

  let userId: string | undefined;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch {
    // auth.getUser() threw — not a fatal error, treat as unauthenticated
  }

  if (!userId) return _mockSellerDashboard();

  const data = await safeQuery(() =>
    supabase
      .from("auctions")
      .select("*, bids(*), questions(*)")
      .eq("seller_id", userId)
      .in("status", ["active", "closed"]),
  );
  if (!data) return _mockSellerDashboard();

  const active = data.filter((r: any) => r.status === "active").map(rowToAuction);
  const closed: SellerClosedAuction[] = data
    .filter((r: any) => r.status === "closed")
    .map((r: any) => {
      const auction = rowToAuction(r);
      return {
        auction,
        provisionalWinner: auction.bids[0]?.bidderName ?? null,
        winningPrice: auction.currentBid,
        outcome: (r.sale_outcome ?? "pending_approval") as SaleOutcome,
      };
    });
  return { active, closed };
}

export async function getBuyerDashboard() {
  if (isServer) return _mockBuyerDashboard();

  let userId: string | undefined;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch {
    // treat as unauthenticated
  }

  if (!userId) return _mockBuyerDashboard();

  const [bidsData, notifData, savedData] = await Promise.all([
    safeQuery(() =>
      supabase
        .from("bids")
        .select("*, auctions(*, bids(*), questions(*))")
        .eq("bidder_id", userId)
        .order("placed_at", { ascending: false }),
    ),
    safeQuery(() =>
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
    ),
    safeQuery(() =>
      supabase.from("saved_searches").select("*").eq("user_id", userId),
    ),
  ]);

  if (!bidsData) return _mockBuyerDashboard();

  // Group by auction; keep the highest bid per auction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byAuction = new Map<string, { auction: Auction; myMaxBid: number }>();
  for (const bid of bidsData as any[]) {
    if (!bid.auctions) continue;
    const aId = bid.auctions.id;
    const existing = byAuction.get(aId);
    if (!existing || bid.amount > existing.myMaxBid) {
      byAuction.set(aId, { auction: rowToAuction(bid.auctions), myMaxBid: bid.amount });
    }
  }

  const activeBids: BuyerBid[] = Array.from(byAuction.values())
    .filter(({ auction }) => auction.status === "active")
    .map(({ auction, myMaxBid }) => ({
      auction,
      myMaxBid,
      autoBidLimit: null,
      status: auction.currentBid != null && auction.currentBid > myMaxBid ? "outbid" : "leading",
    }));

  const won = Array.from(byAuction.values())
    .filter(({ auction, myMaxBid }) => auction.status === "closed" && myMaxBid >= (auction.currentBid ?? 0))
    .map(({ auction, myMaxBid }) => ({
      title: auction.title,
      price: auction.currentBid ?? myMaxBid,
      seller: "Seller",
      status: "Awaiting seller approval",
    }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saved: SavedSearch[] = (savedData ?? []).map((s: any) => ({
    id: s.id,
    label: s.label,
    filters: s.filters as AuctionFilters,
    newMatches: s.new_matches ?? 0,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notifications = (notifData ?? []).map((n: any) => ({
    id: n.id,
    kind: n.kind,
    message: n.message,
    minutesAgo: Math.floor((Date.now() - new Date(n.created_at).getTime()) / 60_000),
    read: n.read,
  }));

  return { activeBids, won, saved, notifications };
}

// ============================================================
// WRITE functions — hit Supabase; return MutationResult
// ============================================================

export async function placeBid(auctionId: string, amount: number): Promise<MutationResult> {
  let userId: string | undefined;
  let profile: { name: string } | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
    if (userId) {
      const res = await supabase.from("profiles").select("name").eq("id", userId).maybeSingle();
      profile = res.data;
    }
  } catch {/* fall through to not-logged-in check */}

  if (!userId)
    return { ok: false, reason: "backend_not_connected", message: "You must be logged in to place a bid." };

  // ── Self-bid guard (backend enforcement) ──────────────────────────────────
  // Check seller_id directly in the DB so this rule holds even if the
  // frontend UI is bypassed (e.g. direct API calls).
  try {
    const { data: auctionRow } = await supabase
      .from("auctions")
      .select("seller_id")
      .eq("id", auctionId)
      .maybeSingle();
    if (auctionRow && auctionRow.seller_id === userId) {
      return {
        ok: false,
        reason: "backend_not_connected",
        message: "You cannot bid on your own listing.",
      };
    }
  } catch {/* if the auction row can't be fetched (e.g. mock mode), skip the check */}
  // ─────────────────────────────────────────────────────────────────────────

  const bidderName = profile?.name ?? "Bidder";

  try {
    const { error: bidError } = await supabase.from("bids").insert({
      auction_id: auctionId,
      bidder_id: userId,
      bidder_name: bidderName,
      amount,
    });
    if (bidError) return { ok: false, reason: "backend_not_connected", message: bidError.message };

    // Atomically update current_bid only if this is the new highest
    await supabase
      .from("auctions")
      .update({ current_bid: amount })
      .eq("id", auctionId)
      .or(`current_bid.is.null,current_bid.lt.${amount}`);

    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: "backend_not_connected", message: String(e) };
  }
}

export async function setAutoBidLimit(
  _auctionId: string,
  _limit: number,
): Promise<MutationResult> {
  return {
    ok: false,
    reason: "backend_not_connected",
    message: "Automatic bidding requires a server-side function — coming in a later phase.",
  };
}

export async function createListing(data: unknown): Promise<MutationResult> {
  let userId: string | undefined;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch {/* fall through */}
  if (!userId)
    return { ok: false, reason: "backend_not_connected", message: "You must be logged in to create a listing." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = data as any;
  const closesAt =
    v.closesDate && v.closesTime
      ? new Date(`${v.closesDate}T${v.closesTime}`).toISOString()
      : new Date(Date.now() + 7 * 24 * 3600_000).toISOString();

  // Upload real photo files to Supabase Storage; fall back gracefully on error
  let photoUrls: string[] = v.photos ?? [];
  const files: File[] = v.photoFiles ?? [];
  if (files.length > 0) {
    const uploaded: string[] = [];
    for (const file of files) {
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("auction-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) {
        console.warn("[CampusBid] Photo upload failed:", uploadError.message);
        // Keep blob URL so the listing still saves (photos just won't persist cross-session)
        continue;
      }
      const { data: { publicUrl } } = supabase.storage
        .from("auction-photos")
        .getPublicUrl(path);
      uploaded.push(publicUrl);
    }
    if (uploaded.length > 0) photoUrls = uploaded;
  }

  try {
    const { error } = await supabase.from("auctions").insert({
      title: v.title,
      category: v.category,
      condition: v.condition,
      description: v.description,
      photos: photoUrls,
      starting_price: Number(v.startingPrice),
      min_increment: Number(v.minIncrement),
      seller_id: userId,
      closes_at: closesAt,
      pickup: v.pickup ?? "",
    });
    if (error) return { ok: false, reason: "backend_not_connected", message: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: "backend_not_connected", message: String(e) };
  }
}


export async function updateListing(id: string, data: unknown): Promise<MutationResult> {
  let userId: string | undefined;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch {/* fall through */}
  if (!userId)
    return { ok: false, reason: "backend_not_connected", message: "You must be logged in to update a listing." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = data as any;

  // Upload any new photo files to Storage before updating
  let photoUrls: string[] = v.photos ?? [];
  const files: File[] = v.photoFiles ?? [];
  if (files.length > 0) {
    const uploaded: string[] = [];
    for (const file of files) {
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("auction-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) {
        console.warn("[CampusBid] Photo upload failed:", uploadError.message);
        uploaded.push(file.name);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from("auction-photos")
          .getPublicUrl(path);
        uploaded.push(publicUrl);
      }
    }
    // Merge: existing permanent URLs (not blob://) + newly uploaded
    const existingPermanent = (v.photos ?? []).filter((p: string) => !p.startsWith("blob:"));
    photoUrls = [...existingPermanent, ...uploaded];
  }

  try {
    const { error } = await supabase
      .from("auctions")
      .update({
        title: v.title,
        category: v.category,
        condition: v.condition,
        description: v.description,
        photos: photoUrls,
        pickup: v.pickup ?? "",
      })
      .eq("id", id)
      .eq("seller_id", userId);
    if (error) return { ok: false, reason: "backend_not_connected", message: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: "backend_not_connected", message: String(e) };
  }
}

export async function cancelListing(id: string): Promise<MutationResult> {
  let userId: string | undefined;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch {/* fall through */}
  if (!userId)
    return { ok: false, reason: "backend_not_connected", message: "You must be logged in to cancel a listing." };

  try {
    const { error } = await supabase
      .from("auctions")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("seller_id", userId);
    if (error) return { ok: false, reason: "backend_not_connected", message: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: "backend_not_connected", message: String(e) };
  }
}

export async function decideWinningPrice(id: string, approve: boolean): Promise<MutationResult> {
  let userId: string | undefined;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch {/* fall through */}
  if (!userId)
    return { ok: false, reason: "backend_not_connected", message: "You must be logged in." };

  const outcome: SaleOutcome = approve ? "approved" : "rejected";
  try {
    const { error } = await supabase
      .from("auctions")
      .update({ sale_outcome: outcome })
      .eq("id", id)
      .eq("seller_id", userId);
    if (error) return { ok: false, reason: "backend_not_connected", message: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: "backend_not_connected", message: String(e) };
  }
}

export async function askQuestion(id: string, q: string): Promise<MutationResult> {
  let userId: string | undefined;
  let displayName = "Anonymous";
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
    if (userId) {
      const { data: p } = await supabase.from("profiles").select("name").eq("id", userId).maybeSingle();
      if (p?.name) displayName = p.name;
    }
  } catch {/* fall through */}

  try {
    const { error } = await supabase.from("questions").insert({
      auction_id: id,
      asked_by: displayName,
      asker_id: userId ?? null,
      question: q,
    });
    if (error) return { ok: false, reason: "backend_not_connected", message: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: "backend_not_connected", message: String(e) };
  }
}

export async function signIn(email: string, password: string): Promise<MutationResult> {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, reason: "backend_not_connected", message: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: "backend_not_connected", message: String(e) };
  }
}

export async function signUp(data: unknown): Promise<MutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: d.email,
      password: d.password,
    });
    if (error) return { ok: false, reason: "backend_not_connected", message: error.message };

    const user = authData.user;
    if (user) {
      const initials = String(d.name ?? "")
        .split(" ")
        .map((n: string) => n[0] ?? "")
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        name: d.name ?? "",
        college: d.college ?? "",
        hostel: d.hostel ?? "",
        batch: d.batch ?? "",
        avatar: initials,
      });
      if (profileError)
        console.warn("[CampusBid] signUp: profile insert failed:", profileError.message);
    }
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: "backend_not_connected", message: String(e) };
  }
}

/** Sign the current user out. Called from AppShell logout button. */
export async function signOut(): Promise<MutationResult> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, reason: "backend_not_connected", message: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, reason: "backend_not_connected", message: String(e) };
  }
}

// ============================================================
// Private mock-fallback helpers
// ============================================================

function _mockHomeFeed() {
  const active = filterAuctions(mockAuctions, {});
  return {
    featured: active.filter((a) => a.featured).slice(0, 4),
    recent: filterAuctions(mockAuctions, { sort: "newest" }).slice(0, 8),
    closingSoon: filterAuctions(mockAuctions, { closingSoon: true }).slice(0, 4),
  };
}

function _mockSellerDashboard() {
  const mine = mockAuctions.filter((a) => a.sellerId === demoUserId);
  const closed: SellerClosedAuction[] = mine
    .filter((a) => a.status === "closed")
    .map((a, i) => ({
      auction: a,
      provisionalWinner: a.bids[0]?.bidderName ?? null,
      winningPrice: a.currentBid,
      outcome: (i === 0 ? "pending_approval" : "completed") as SaleOutcome,
    }));
  return { active: mine.filter((a) => a.status === "active"), closed };
}

function _mockBuyerDashboard() {
  const pick = (id: string) => mockAuctions.find((a) => a.id === id)!;
  const activeBids: BuyerBid[] = [
    { auction: pick("a4"), myMaxBid: 24000, autoBidLimit: 26000, status: "outbid" },
    { auction: pick("a2"), myMaxBid: 3800, autoBidLimit: null, status: "leading" },
    { auction: pick("a7"), myMaxBid: 12250, autoBidLimit: 14000, status: "outbid" },
  ];
  const won = [
    { title: "Prestige Electric Kettle 1.5L", price: 650, seller: "Priya Iyer", status: "Awaiting seller approval" },
    { title: "Wildcraft Laptop Backpack", price: 900, seller: "Rohan Mehta", status: "Collected" },
  ];
  const saved: SavedSearch[] = [
    { id: "ss1", label: "Books under ₹1,500", filters: { category: "Books", maxPrice: 1500 }, newMatches: 3 },
    { id: "ss2", label: "Cycles closing soon", filters: { category: "Cycles", closingSoon: true }, newMatches: 1 },
  ];
  return { activeBids, won, saved, notifications: mockNotifications };
}
