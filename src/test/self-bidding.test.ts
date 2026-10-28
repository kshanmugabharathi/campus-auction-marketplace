/**
 * Self-bidding rules — the seller of a listing must never be able to bid on it,
 * while every other authenticated user still can when the auction is open.
 *
 * The Supabase client is mocked so we can drive `placeBid()` (the data-layer
 * write that enforces the rule before hitting the DB) with a chosen current
 * user and auction seller. The `@/lib/supabase` module also throws at import
 * time without env vars, so mocking it keeps this file self-contained.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isSelfBid, placeBid } from "@/lib/data/api";
import type { Auction } from "@/lib/data/types";

// Mutable scenario state shared with the mocked client (hoisted so vi.mock can see it).
const state = vi.hoisted(() => ({
  userId: null as string | null,
  sellerId: null as string | null,
  insertError: null as string | null,
}));

vi.mock("@/lib/supabase", () => {
  // A fluent, awaitable chain that resolves to `result` no matter how it is
  // narrowed (.select/.eq/.or/.update) or terminated (.maybeSingle/.insert).
  const chain = (result: unknown) => {
    const c: Record<string, unknown> = {
      select: () => c,
      eq: () => c,
      or: () => c,
      update: () => c,
      maybeSingle: () => Promise.resolve(result),
      insert: () => Promise.resolve(result),
      then: (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
        Promise.resolve(result).then(onFulfilled, onRejected),
    };
    return c;
  };

  return {
    supabase: {
      auth: {
        getUser: async () => ({
          data: { user: state.userId ? { id: state.userId } : null },
        }),
      },
      from: (table: string) => {
        if (table === "profiles") return chain({ data: { name: "Test User" }, error: null });
        if (table === "auctions") return chain({ data: { seller_id: state.sellerId }, error: null });
        if (table === "bids") return chain({ error: state.insertError ? { message: state.insertError } : null });
        return chain({ data: null, error: null });
      },
    },
  };
});

const SELLER = "00000000-0000-0000-0000-000000000001";
const BUYER = "00000000-0000-0000-0000-000000000002";

const auction = (over: Partial<Auction> = {}): Auction => ({
  id: "a1",
  title: "MacBook Air M1",
  category: "Electronics",
  condition: "Good",
  description: "Used for assignments.",
  photos: [],
  startingPrice: 38000,
  minIncrement: 500,
  currentBid: 40000,
  bids: [],
  questions: [],
  sellerId: SELLER,
  createdAt: new Date().toISOString(),
  closesAt: new Date(Date.now() + 3600_000).toISOString(),
  status: "active",
  pickup: "Hostel gate",
  ...over,
});

beforeEach(() => {
  state.userId = null;
  state.sellerId = null;
  state.insertError = null;
});

describe("isSelfBid (pure frontend/UI guard)", () => {
  it("is true when the current user is the seller", () => {
    expect(isSelfBid(auction(), SELLER)).toBe(true);
  });
  it("is false for a different authenticated user", () => {
    expect(isSelfBid(auction(), BUYER)).toBe(false);
  });
  it("is false when nobody is signed in", () => {
    expect(isSelfBid(auction(), null)).toBe(false);
    expect(isSelfBid(auction(), undefined)).toBe(false);
  });
});

describe("placeBid enforces the self-bid rule in the data layer", () => {
  it("rejects the seller bidding on their own listing", async () => {
    state.userId = SELLER;
    state.sellerId = SELLER;

    const result = await placeBid("a1", 40500);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe("You cannot bid on your own listing.");
  });

  it("lets another authenticated user bid on an open listing that passes the rules", async () => {
    state.userId = BUYER;
    state.sellerId = SELLER;

    const result = await placeBid("a1", 40500);

    expect(result.ok).toBe(true);
  });

  it("surfaces a database rejection (self-bid trigger) instead of faking success", async () => {
    // Simulate a caller who bypassed the app-level check: the DB trigger refuses the row.
    state.userId = BUYER;
    state.sellerId = SELLER;
    state.insertError = "You cannot bid on your own listing.";

    const result = await placeBid("a1", 40500);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("cannot bid on your own listing");
  });

  it("requires an authenticated user", async () => {
    state.userId = null;

    const result = await placeBid("a1", 40500);

    expect(result.ok).toBe(false);
  });
});
