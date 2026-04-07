-- TCGSignals Database Schema
-- Each card variant (regular, holo, full art, SAR, etc.) is its own row

-- ===== TCGs =====
CREATE TABLE tcgs (
  id TEXT PRIMARY KEY,           -- 'pokemon', 'onepiece'
  name TEXT NOT NULL,            -- 'Pokemon TCG'
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  color TEXT,                    -- hex color
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Sets =====
CREATE TABLE sets (
  id TEXT PRIMARY KEY,           -- 'sv8', 'sv4pt5', 'OP-09'
  tcg_id TEXT NOT NULL REFERENCES tcgs(id),
  name TEXT NOT NULL,            -- 'Surging Sparks'
  slug TEXT NOT NULL,
  code TEXT,                     -- set code from API
  release_date DATE,
  card_count INTEGER DEFAULT 0,
  total_printed INTEGER,
  image_url TEXT,                -- set logo/symbol
  series TEXT,                   -- 'Scarlet & Violet', 'OP'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tcg_id, slug)
);

-- ===== Cards =====
-- Each variant is a separate row (e.g., Charizard ex regular vs Charizard ex SAR)
CREATE TABLE cards (
  id TEXT PRIMARY KEY,           -- external ID from API: 'sv8-6', 'OP09-119'
  tcg_id TEXT NOT NULL REFERENCES tcgs(id),
  set_id TEXT NOT NULL REFERENCES sets(id),
  name TEXT NOT NULL,            -- 'Charizard ex'
  number TEXT NOT NULL,          -- '234/091' or 'OP09-119'
  rarity TEXT,                   -- 'Special Illustration Rare', 'SEC', etc.
  supertype TEXT,                -- 'Pokemon', 'Trainer', 'Energy', 'Leader', 'Character'
  subtypes TEXT[],               -- ['ex', 'Stage 2'] or ['Straw Hat Crew']
  types TEXT[],                  -- ['Fire'] or ['STR']
  image_small TEXT,              -- small image URL
  image_large TEXT,              -- high-res image URL
  artist TEXT,
  flavor_text TEXT,
  hp TEXT,
  tcg_external_id TEXT,          -- original API id for lookups
  tcgplayer_url TEXT,            -- direct link to TCGPlayer listing
  cardmarket_url TEXT,           -- direct link to CardMarket listing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search vector
ALTER TABLE cards ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    TO_TSVECTOR('english',
      COALESCE(name, '') || ' ' ||
      COALESCE(number, '') || ' ' ||
      COALESCE(rarity, '') || ' ' ||
      COALESCE(artist, '')
    )
  ) STORED;

-- ===== Prices (append-only time series) =====
CREATE TABLE prices (
  id BIGSERIAL PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id),
  source TEXT NOT NULL,          -- 'tcgplayer', 'cardmarket', 'ebay'
  price DECIMAL(10,2) NOT NULL,
  condition TEXT DEFAULT 'Near Mint',  -- NM, LP, MP, HP, DMG
  currency TEXT DEFAULT 'USD',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Price Summaries (materialized, updated by cron) =====
CREATE TABLE price_summaries (
  card_id TEXT PRIMARY KEY REFERENCES cards(id),
  current_price DECIMAL(10,2),
  previous_price DECIMAL(10,2),   -- price 24h ago
  price_change_24h DECIMAL(6,2),  -- percentage
  price_change_7d DECIMAL(6,2),
  low_30d DECIMAL(10,2),
  high_30d DECIMAL(10,2),
  avg_30d DECIMAL(10,2),
  last_sold_price DECIMAL(10,2),
  last_sold_platform TEXT,
  last_sold_date TIMESTAMPTZ,
  last_sold_condition TEXT,
  volume_24h INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Platform Listings (current prices per platform) =====
CREATE TABLE platform_listings (
  id BIGSERIAL PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id),
  platform TEXT NOT NULL,         -- 'tcgplayer', 'cardmarket', 'ebay'
  price DECIMAL(10,2) NOT NULL,
  condition TEXT DEFAULT 'Near Mint',
  url TEXT,                       -- affiliate/direct link
  in_stock BOOLEAN DEFAULT TRUE,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id, platform, condition)
);

-- ===== Indexes =====
CREATE INDEX idx_cards_tcg ON cards(tcg_id);
CREATE INDEX idx_cards_set ON cards(set_id);
CREATE INDEX idx_cards_name ON cards(name);
CREATE INDEX idx_cards_rarity ON cards(rarity);
CREATE INDEX idx_cards_search ON cards USING GIN(search_vector);
CREATE INDEX idx_prices_card_date ON prices(card_id, recorded_at DESC);
CREATE INDEX idx_prices_source ON prices(source);
CREATE INDEX idx_price_summaries_change ON price_summaries(price_change_24h DESC NULLS LAST);
CREATE INDEX idx_price_summaries_price ON price_summaries(current_price DESC NULLS LAST);
CREATE INDEX idx_platform_listings_card ON platform_listings(card_id);
CREATE INDEX idx_sets_tcg ON sets(tcg_id);

-- ===== Seed TCGs =====
INSERT INTO tcgs (id, name, slug, color) VALUES
  ('pokemon', 'Pokemon TCG', 'pokemon', '#FFCB05'),
  ('onepiece', 'One Piece TCG', 'onepiece', '#E21B26');

-- ===== RLS Policies (public read, service role write) =====
ALTER TABLE tcgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_listings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read tcgs" ON tcgs FOR SELECT USING (true);
CREATE POLICY "Public read sets" ON sets FOR SELECT USING (true);
CREATE POLICY "Public read cards" ON cards FOR SELECT USING (true);
CREATE POLICY "Public read prices" ON prices FOR SELECT USING (true);
CREATE POLICY "Public read price_summaries" ON price_summaries FOR SELECT USING (true);
CREATE POLICY "Public read platform_listings" ON platform_listings FOR SELECT USING (true);
