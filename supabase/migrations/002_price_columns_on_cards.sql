-- Denormalize price data onto cards table for efficient sorting/filtering
-- Synced via trigger from price_summaries

-- Add price columns to cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS current_price DECIMAL(10,2);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS price_change_24h DECIMAL(6,2);

-- Add numeric sort column for card numbers (string "10" sorts wrong vs "2")
ALTER TABLE cards ADD COLUMN IF NOT EXISTS number_sort INTEGER;

-- Indexes for sorting
CREATE INDEX IF NOT EXISTS idx_cards_current_price ON cards(current_price DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_cards_price_change ON cards(price_change_24h DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_cards_number_sort ON cards(number_sort ASC NULLS LAST);

-- Trigger: sync price from price_summaries to cards on every insert/update
CREATE OR REPLACE FUNCTION sync_card_price() RETURNS TRIGGER AS $$
BEGIN
  UPDATE cards
  SET current_price = NEW.current_price,
      price_change_24h = NEW.price_change_24h
  WHERE id = NEW.card_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_card_price ON price_summaries;
CREATE TRIGGER trg_sync_card_price
AFTER INSERT OR UPDATE ON price_summaries
FOR EACH ROW EXECUTE FUNCTION sync_card_price();

-- Backfill prices from existing price_summaries
UPDATE cards c
SET current_price = ps.current_price,
    price_change_24h = ps.price_change_24h
FROM price_summaries ps
WHERE c.id = ps.card_id;

-- Backfill number_sort: extract leading digits from card number
UPDATE cards SET number_sort =
  CASE
    WHEN number ~ '\d' THEN (regexp_match(number, '(\d+)'))[1]::integer
    ELSE 999999
  END;
