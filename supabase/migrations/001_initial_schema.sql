-- =============================================================
-- CampusBid — Initial Schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor).
-- Idempotent: every statement uses IF NOT EXISTS / DO $$ guards.
-- Compatible with PostgreSQL 15 (Supabase default as of 2024).
-- =============================================================

-- ---------------------------------------------------------------
-- ENUMS (must match the TypeScript union types in types.ts exactly)
-- ---------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE category AS ENUM (
    'Electronics','Books','Furniture','Cycles',
    'Instruments','Hostel Essentials','Sports'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE condition AS ENUM ('Like New','Good','Fair','Well Used');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE auction_status AS ENUM ('active','closed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sale_outcome AS ENUM (
    'pending_approval','approved','rejected','completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_kind AS ENUM (
    'outbid','won','closing','answer','match'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------
-- PROFILES  (1-to-1 with auth.users; maps to Student type)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT         NOT NULL,
  college     TEXT         NOT NULL DEFAULT '',
  hostel      TEXT         NOT NULL DEFAULT '',
  batch       TEXT         NOT NULL DEFAULT '',
  avatar      TEXT         NOT NULL DEFAULT '',   -- initials string e.g. "AS"
  rating      NUMERIC(3,1) NOT NULL DEFAULT 5.0,
  sales_count INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- AUCTIONS  (maps to Auction type)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auctions (
  id              TEXT           PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title           TEXT           NOT NULL,
  category        category       NOT NULL,
  condition       condition      NOT NULL,
  description     TEXT           NOT NULL,
  photos          TEXT[]         NOT NULL DEFAULT '{}',
  starting_price  INT            NOT NULL,
  min_increment   INT            NOT NULL,
  current_bid     INT,                             -- NULL = no bids yet
  seller_id       UUID           NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  closes_at       TIMESTAMPTZ    NOT NULL,
  status          auction_status NOT NULL DEFAULT 'active',
  featured        BOOLEAN        NOT NULL DEFAULT false,
  pickup          TEXT           NOT NULL DEFAULT '',
  sale_outcome    sale_outcome,
  winning_bidder_id UUID REFERENCES profiles(id)
);

-- ---------------------------------------------------------------
-- BIDS  (maps to Bid type)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bids (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  auction_id  TEXT        NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id   UUID        NOT NULL REFERENCES profiles(id),
  bidder_name TEXT        NOT NULL,
  amount      INT         NOT NULL,
  placed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- QUESTIONS  (maps to Question type)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  auction_id  TEXT        NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  asked_by    TEXT        NOT NULL,   -- display name of asker
  asker_id    UUID        REFERENCES profiles(id),
  question    TEXT        NOT NULL,
  answer      TEXT,                   -- NULL = unanswered
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- SAVED SEARCHES  (maps to SavedSearch type)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_searches (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL,
  filters     JSONB       NOT NULL DEFAULT '{}',
  new_matches INT         NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------
-- NOTIFICATIONS  (maps to AppNotification type)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT              PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     UUID              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind        notification_kind NOT NULL,
  message     TEXT              NOT NULL,
  read        BOOLEAN           NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_auctions_status      ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_closes_at   ON auctions(closes_at);
CREATE INDEX IF NOT EXISTS idx_auctions_seller_id   ON auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_auctions_category    ON auctions(category);
CREATE INDEX IF NOT EXISTS idx_bids_auction_id      ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id       ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_amount          ON bids(auction_id, amount DESC);
CREATE INDEX IF NOT EXISTS idx_questions_auction_id ON questions(auction_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user_read     ON notifications(user_id, read);

-- ---------------------------------------------------------------
-- ROW LEVEL SECURITY — enable on every table
-- ---------------------------------------------------------------
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids            ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- RLS POLICIES
-- "CREATE POLICY IF NOT EXISTS" requires PG17+; we use DO $$ guards
-- for PG15 compatibility (current Supabase default).
-- ---------------------------------------------------------------

-- PROFILES -------------------------------------------------------
DO $$ BEGIN
  CREATE POLICY "profiles_public_read"
    ON profiles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_owner_insert"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_owner_update"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AUCTIONS -------------------------------------------------------
-- Anyone can read active auctions
DO $$ BEGIN
  CREATE POLICY "auctions_public_read_active"
    ON auctions FOR SELECT USING (status = 'active');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sellers can always read their own auctions (including closed/cancelled)
DO $$ BEGIN
  CREATE POLICY "auctions_seller_read_own"
    ON auctions FOR SELECT USING (auth.uid() = seller_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authenticated users can create auctions (seller_id must be their own uid)
DO $$ BEGIN
  CREATE POLICY "auctions_auth_insert"
    ON auctions FOR INSERT WITH CHECK (auth.uid() = seller_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only the seller can update their own auction
DO $$ BEGIN
  CREATE POLICY "auctions_seller_update"
    ON auctions FOR UPDATE USING (auth.uid() = seller_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- BIDS (all bids on active auctions are publicly readable for bid-history) ---
DO $$ BEGIN
  CREATE POLICY "bids_public_read"
    ON bids FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "bids_auth_insert"
    ON bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reject self-bids at the database level. A seller must never be able to bid
-- on their own auction, even if they call the API directly and bypass the UI
-- button guard (auction.$id.tsx) and the application guard (api.ts placeBid).
-- This trigger is the authoritative backstop: it runs inside the same
-- transaction as the INSERT, so the offending row is never written.
CREATE OR REPLACE FUNCTION public.reject_self_bid()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $fn$
DECLARE
  v_seller_id UUID;
BEGIN
  SELECT seller_id INTO v_seller_id
    FROM public.auctions
    WHERE id = NEW.auction_id;

  IF v_seller_id IS NOT NULL AND v_seller_id = NEW.bidder_id THEN
    RAISE EXCEPTION 'You cannot bid on your own listing.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_bids_reject_self_bid ON public.bids;
CREATE TRIGGER trg_bids_reject_self_bid
  BEFORE INSERT ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_self_bid();

-- QUESTIONS ------------------------------------------------------
DO $$ BEGIN
  CREATE POLICY "questions_public_read"
    ON questions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "questions_auth_ask"
    ON questions FOR INSERT WITH CHECK (auth.uid() = asker_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seller can answer questions on their own auction
DO $$ BEGIN
  CREATE POLICY "questions_seller_answer"
    ON questions FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM auctions a
        WHERE a.id = auction_id AND a.seller_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- SAVED SEARCHES (owner only) ------------------------------------
DO $$ BEGIN
  CREATE POLICY "saved_searches_owner_select"
    ON saved_searches FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "saved_searches_owner_insert"
    ON saved_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "saved_searches_owner_update"
    ON saved_searches FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "saved_searches_owner_delete"
    ON saved_searches FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- NOTIFICATIONS (owner only) -------------------------------------
DO $$ BEGIN
  CREATE POLICY "notifications_owner_select"
    ON notifications FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "notifications_owner_update"
    ON notifications FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------
-- STORAGE BUCKET for auction photos
-- Run these SEPARATELY after creating the bucket in the dashboard:
--   Dashboard → Storage → New bucket → name "auction-photos" → Public
-- ---------------------------------------------------------------
-- CREATE POLICY "auction_photos_public_read"
--   ON storage.objects FOR SELECT USING (bucket_id = 'auction-photos');
--
-- CREATE POLICY "auction_photos_auth_upload"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'auction-photos' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "auction_photos_owner_delete"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'auction-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
