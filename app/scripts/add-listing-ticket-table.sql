-- =========================================================
-- Add LISTING_TICKET table for Exchange listings
-- This allows listing owners to specify which tickets they offer
-- =========================================================

-- Create LISTING_TICKET table
CREATE TABLE IF NOT EXISTS LISTING_TICKET (
    listing_id INTEGER NOT NULL
        REFERENCES LISTING(listing_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    ticket_id  INTEGER NOT NULL
        REFERENCES TICKET(ticket_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    PRIMARY KEY (listing_id, ticket_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_listing_ticket_listing ON LISTING_TICKET(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_ticket_ticket ON LISTING_TICKET(ticket_id);

-- Comment
COMMENT ON TABLE LISTING_TICKET IS 'Associates tickets with listings, especially for Exchange type listings where the owner specifies which tickets they offer';

