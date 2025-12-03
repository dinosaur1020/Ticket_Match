-- =========================================================
-- Add offered_ticket_ids column to LISTING table
-- For Exchange and Sell listings to specify which tickets are offered
-- =========================================================

-- Add the column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listing' 
        AND column_name = 'offered_ticket_ids'
    ) THEN
        ALTER TABLE LISTING ADD COLUMN offered_ticket_ids INTEGER[] DEFAULT NULL;
    END IF;
END $$;

-- Add index for array queries
CREATE INDEX IF NOT EXISTS idx_listing_offered_tickets ON LISTING USING GIN (offered_ticket_ids);

-- Comment
COMMENT ON COLUMN LISTING.offered_ticket_ids IS 'Array of ticket IDs that the listing owner offers (for Exchange and Sell listings)';

