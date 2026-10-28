import { describe, expect, it } from "vitest";
import { filterAuctions, nextMinBid, placeBid } from "@/lib/data/api";
import { auctions } from "@/lib/data/mock";

describe("bidding rules", () => {
  it("next bid with no bids equals the starting price", () => {
    const a = auctions.find((x) => x.bids.length === 0)!;
    expect(nextMinBid(a)).toBe(a.startingPrice);
  });
  it("next bid is leading bid plus minimum increment", () => {
    const a = auctions.find((x) => x.id === "a1")!;
    expect(nextMinBid(a)).toBe(a.currentBid! + 500);
  });
  it("placing a bid is not faked while the backend is disconnected", async () => {
    expect((await placeBid("a1", 50000)).ok).toBe(false);
  });
  it("closed auctions are excluded from browsing", () => {
    expect(filterAuctions(auctions, {}).some((a) => a.status !== "active")).toBe(false);
  });
});
