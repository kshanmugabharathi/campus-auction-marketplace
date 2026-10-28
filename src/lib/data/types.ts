export type Category =
  | "Electronics"
  | "Books"
  | "Furniture"
  | "Cycles"
  | "Instruments"
  | "Hostel Essentials"
  | "Sports";

export type Condition = "Like New" | "Good" | "Fair" | "Well Used";

export type AuctionStatus = "active" | "closed" | "cancelled";

export interface Student {
  id: string;
  name: string;
  college: string;
  hostel: string;
  batch: string;
  avatar: string;
  rating: number;
  salesCount: number;
}

export interface Bid {
  id: string;
  bidderName: string;
  amount: number;
  placedAt: string; // ISO
}

export interface Question {
  id: string;
  askedBy: string;
  question: string;
  answer?: string;
}

export interface Auction {
  id: string;
  title: string;
  category: Category;
  condition: Condition;
  description: string;
  photos: string[];
  startingPrice: number;
  minIncrement: number;
  currentBid: number | null;
  bids: Bid[];
  questions: Question[];
  sellerId: string;
  createdAt: string;
  closesAt: string;
  status: AuctionStatus;
  featured?: boolean;
  pickup: string;
}

export interface AuctionFilters {
  q?: string;
  category?: Category | "All";
  condition?: Condition | "Any";
  minPrice?: number;
  maxPrice?: number;
  closingSoon?: boolean;
  sort?: "closing" | "newest" | "price-asc" | "price-desc";
}

export type SaleOutcome = "pending_approval" | "approved" | "rejected" | "completed";

export interface SellerClosedAuction {
  auction: Auction;
  provisionalWinner: string | null;
  winningPrice: number | null;
  outcome: SaleOutcome;
}

export interface BuyerBid {
  auction: Auction;
  myMaxBid: number;
  autoBidLimit: number | null;
  status: "leading" | "outbid";
}

export interface SavedSearch {
  id: string;
  label: string;
  filters: AuctionFilters;
  newMatches: number;
}

export interface AppNotification {
  id: string;
  kind: "outbid" | "won" | "closing" | "answer" | "match";
  message: string;
  minutesAgo: number;
  read: boolean;
}

/** Result of a write action. Until the backend is connected every write returns ok:false. */
export type MutationResult =
  | { ok: true }
  | { ok: false; reason: "backend_not_connected"; message: string };
