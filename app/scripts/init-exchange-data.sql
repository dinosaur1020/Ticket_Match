-- =========================================================
-- Initialize Exchange Data for Testing
-- Run this after the main schema and seed data
-- =========================================================

-- First, add the offered_ticket_ids column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listing'
        AND column_name = 'offered_ticket_ids'
    ) THEN
        ALTER TABLE LISTING ADD COLUMN offered_ticket_ids INTEGER[] DEFAULT NULL;
        RAISE NOTICE 'Added offered_ticket_ids column to LISTING table';
    ELSE
        RAISE NOTICE 'offered_ticket_ids column already exists';
    END IF;
END $$;

-- Create index for the array column
CREATE INDEX IF NOT EXISTS idx_listing_offered_tickets ON LISTING USING GIN (offered_ticket_ids);

-- Update existing Sell and Exchange listings with offered_ticket_ids
-- Alice's listings
UPDATE listing SET offered_ticket_ids = '{1,2}' WHERE listing_id = 1;  -- 五月天A區2連號
UPDATE listing SET offered_ticket_ids = '{5}' WHERE listing_id = 3;   -- 周杰倫A區
UPDATE listing SET offered_ticket_ids = '{6,7}' WHERE listing_id = 5; -- 五月天A區連號
UPDATE listing SET offered_ticket_ids = '{10,11}' WHERE listing_id = 6; -- 周杰倫VIP
UPDATE listing SET offered_ticket_ids = '{14}' WHERE listing_id = 8; -- 周杰倫VIP

-- Bob's listings
UPDATE listing SET offered_ticket_ids = '{4}' WHERE listing_id = 7;   -- 五月天C區 (completed)
UPDATE listing SET offered_ticket_ids = '{18,19}' WHERE listing_id = 9; -- 告五人2張
UPDATE listing SET offered_ticket_ids = '{23}' WHERE listing_id = 10; -- 林俊傑B區
UPDATE listing SET offered_ticket_ids = '{26}' WHERE listing_id = 11; -- 音樂節搖滾區
UPDATE listing SET offered_ticket_ids = '{20,21}' WHERE listing_id = 12; -- 告五人出售
UPDATE listing SET offered_ticket_ids = '{27}' WHERE listing_id = 13; -- 金曲獎VIP
UPDATE listing SET offered_ticket_ids = '{9}' WHERE listing_id = 14; -- 五月天C區
UPDATE listing SET offered_ticket_ids = '{16}' WHERE listing_id = 15; -- 周杰倫VIP
UPDATE listing SET offered_ticket_ids = '{24,25}' WHERE listing_id = 16; -- Jolin2張

-- More listings
UPDATE listing SET offered_ticket_ids = '{22}' WHERE listing_id = 17; -- JJ演唱會
UPDATE listing SET offered_ticket_ids = '{28,29}' WHERE listing_id = 18; -- Hebe票券
UPDATE listing SET offered_ticket_ids = '{30,31}' WHERE listing_id = 19; -- 音樂節票
UPDATE listing SET offered_ticket_ids = '{32}' WHERE listing_id = 20; -- 周興哲
UPDATE listing SET offered_ticket_ids = '{33}' WHERE listing_id = 21; -- LaLa演唱會

-- Add some Exchange listings for testing
INSERT INTO listing (user_id, event_id, event_date, content, status, type, offered_ticket_ids) VALUES
(1, 1, '2025-12-21 19:00:00', '五月天12/21 A區連號2張，想換12/27同場次VIP', 'Active', 'Exchange', '{1,2}'),
(2, 4, '2025-12-25 19:00:00', '告五人聖誕場VIP票，想換五月天任一場', 'Active', 'Exchange', '{17}'),
(6, 1, '2025-12-27 19:00:00', '五月天12/27 VIP區，想換周杰倫VIP票', 'Active', 'Exchange', '{15}'),
(4, 2, '2026-01-17 19:30:00', '周杰倫VIP區，想換告五人聖誕場VIP', 'Active', 'Exchange', '{13}'),
(3, 5, '2026-03-07 19:00:00', '林俊傑VIP票，換田馥甄演唱會票', 'Active', 'Exchange', '{21}');

-- Show the results
SELECT
    l.listing_id,
    u.username,
    e.event_name,
    l.type,
    l.offered_ticket_ids,
    CASE
        WHEN l.type IN ('Sell', 'Exchange') THEN array_length(l.offered_ticket_ids, 1)
        ELSE NULL
    END as ticket_count
FROM listing l
JOIN "USER" u ON l.user_id = u.user_id
JOIN event e ON l.event_id = e.event_id
WHERE l.status = 'Active' AND l.type IN ('Sell', 'Exchange')
ORDER BY l.listing_id;

SELECT 'Exchange data initialized successfully!' as status;
SELECT COUNT(*) as exchange_listing_count FROM listing WHERE type = 'Exchange' AND status = 'Active';
SELECT COUNT(*) as sell_listing_count FROM listing WHERE type = 'Sell' AND status = 'Active';
