-- =========================================================
-- Ticket Match Database Schema
-- 第十四組 - 資料庫管理期末專案
-- =========================================================

-- 依相依順序刪除既有資料表（如果存在）
DROP TABLE IF EXISTS USER_BALANCE_LOG CASCADE;
DROP TABLE IF EXISTS TRADE_TICKET CASCADE;
DROP TABLE IF EXISTS TRADE_PARTICIPANT CASCADE;
DROP TABLE IF EXISTS TRADE CASCADE;
DROP TABLE IF EXISTS LISTING_TICKET CASCADE;
DROP TABLE IF EXISTS LISTING CASCADE;
DROP TABLE IF EXISTS TICKET CASCADE;
DROP TABLE IF EXISTS EVENT_PERFORMER CASCADE;
DROP TABLE IF EXISTS EVENTTIME CASCADE;
DROP TABLE IF EXISTS EVENT CASCADE;
DROP TABLE IF EXISTS USER_ROLE CASCADE;
DROP TABLE IF EXISTS "USER" CASCADE;

-- =========================================================
-- 1. USER
-- =========================================================
CREATE TABLE "USER" (
    user_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username       VARCHAR(50) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    email          VARCHAR(100) UNIQUE NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'Active',
    -- 'Active', 'Suspended', 'Warning', ...
    balance        DECIMAL(10,2) NOT NULL DEFAULT 10000,
    user_description TEXT,
    -- Optional user bio/description (max 500 characters)
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_user_status CHECK (status IN ('Active', 'Suspended', 'Warning')),
    CONSTRAINT check_balance_non_negative CHECK (balance >= 0),
    CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT check_user_description_length CHECK (user_description IS NULL OR length(user_description) <= 500)
);

-- =========================================================
-- 2. USER_ROLE
-- =========================================================
CREATE TABLE USER_ROLE (
    user_id UUID NOT NULL
        REFERENCES "USER"(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    role    VARCHAR(20) NOT NULL,
    -- 'User', 'Admin', ...

    PRIMARY KEY (user_id, role),
    CONSTRAINT check_role CHECK (role IN ('User', 'Operator'))
);

-- =========================================================
-- 3. EVENT
-- =========================================================
CREATE TABLE EVENT (
    event_id    SERIAL PRIMARY KEY,
    event_name  VARCHAR(200) NOT NULL,
    venue       VARCHAR(200) NOT NULL,
    description TEXT
);

-- =========================================================
-- 4. EVENTTIME
-- =========================================================
CREATE TABLE EVENTTIME (
    eventtime_id SERIAL PRIMARY KEY,
    event_id     INTEGER NOT NULL
        REFERENCES EVENT(event_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    start_time   TIMESTAMP NOT NULL,
    end_time     TIMESTAMP,

    UNIQUE (event_id, start_time),
    CONSTRAINT check_event_times CHECK (end_time IS NULL OR end_time > start_time)
);

-- =========================================================
-- 5. EVENT_PERFORMER
-- =========================================================
CREATE TABLE EVENT_PERFORMER (
    event_id   INTEGER NOT NULL
        REFERENCES EVENT(event_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    performer  VARCHAR(255) NOT NULL,

    PRIMARY KEY (event_id, performer)
);

-- =========================================================
-- 6. TICKET
-- =========================================================
CREATE TABLE TICKET (
    ticket_id      SERIAL PRIMARY KEY,
    eventtime_id   INTEGER NOT NULL
        REFERENCES EVENTTIME(eventtime_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    owner_id       UUID NOT NULL
        REFERENCES "USER"(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    seat_area      VARCHAR(20) NOT NULL,
    seat_number    VARCHAR(20) NOT NULL,
    price          DECIMAL(10,2) NOT NULL,

    status         VARCHAR(20) NOT NULL DEFAULT 'Active',
    -- 'Active', 'Locked', 'Completed', 'Expired', 'Canceled'

    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_ticket_status CHECK (status IN ('Active', 'Locked', 'Expired', 'Canceled')),
    CONSTRAINT check_ticket_price_positive CHECK (price > 0),
    CONSTRAINT unique_ticket_seat UNIQUE (eventtime_id, seat_area, seat_number)
);

-- =========================================================
-- 7. LISTING
-- =========================================================
CREATE TABLE LISTING (
    listing_id  SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL
        REFERENCES "USER"(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    event_id    INTEGER NOT NULL
        REFERENCES EVENT(event_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    event_date  TIMESTAMP NOT NULL,   -- 使用者發文時選擇的日期
    content     TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'Active',
    -- 'Active', 'Canceled', 'Completed', 'Expired'

    type        VARCHAR(20) NOT NULL,
    -- 'Sell', 'Buy', 'Exchange'

    offered_ticket_ids INTEGER[] DEFAULT NULL,
    -- Array of ticket IDs that the listing owner offers (for Exchange and Sell listings)

    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_listing_status CHECK (status IN ('Active', 'Canceled', 'Completed', 'Expired')),
    CONSTRAINT check_listing_type CHECK (type IN ('Sell', 'Buy', 'Exchange'))
);

-- =========================================================
-- 8. LISTING_TICKET
-- =========================================================
CREATE TABLE LISTING_TICKET (
    listing_id  INTEGER NOT NULL
        REFERENCES LISTING(listing_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    ticket_id   INTEGER NOT NULL
        REFERENCES TICKET(ticket_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    PRIMARY KEY (listing_id, ticket_id)
);

-- =========================================================
-- 9. TRADE
-- =========================================================
-- Version A: 每筆 TRADE 只對應一則 LISTING（發文者）
CREATE TABLE TRADE (
    trade_id      SERIAL PRIMARY KEY,

    listing_id    INTEGER NOT NULL
        REFERENCES LISTING(listing_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    status        VARCHAR(20) NOT NULL DEFAULT 'Pending',
    -- 'Pending', 'Completed', 'Canceled', 'Disputed', 'Expired'

    agreed_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
    -- 整筆交易雙方協議的總金額，以 listing 發文者為賣方

    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_trade_status CHECK (status IN ('Pending', 'Completed', 'Canceled', 'Disputed', 'Expired')),
    CONSTRAINT check_agreed_price_non_negative CHECK (agreed_price >= 0)
);

-- =========================================================
-- 10. TRADE_PARTICIPANT
-- =========================================================
CREATE TABLE TRADE_PARTICIPANT (
    trade_id      INTEGER NOT NULL
        REFERENCES TRADE(trade_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    user_id       UUID NOT NULL
        REFERENCES "USER"(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    role          VARCHAR(20) NOT NULL,
    -- 'buyer', 'seller', 'exchanger'

    confirmed     BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at  TIMESTAMP,

    PRIMARY KEY (trade_id, user_id),
    CONSTRAINT check_participant_role CHECK (role IN ('buyer', 'seller', 'exchanger'))
);

-- =========================================================
-- 11. TRADE_TICKET
-- =========================================================
CREATE TABLE TRADE_TICKET (
    trade_id      INTEGER NOT NULL
        REFERENCES TRADE(trade_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    ticket_id     INTEGER NOT NULL
        REFERENCES TICKET(ticket_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    from_user_id  UUID NOT NULL
        REFERENCES "USER"(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    to_user_id    UUID NOT NULL
        REFERENCES "USER"(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    PRIMARY KEY (trade_id, ticket_id),

    -- 保證 from/to user 都是此 TRADE 的 participant
    FOREIGN KEY (trade_id, from_user_id)
        REFERENCES TRADE_PARTICIPANT(trade_id, user_id),

    FOREIGN KEY (trade_id, to_user_id)
        REFERENCES TRADE_PARTICIPANT(trade_id, user_id)
);

-- =========================================================
-- 12. USER_BALANCE_LOG
-- =========================================================
CREATE TABLE USER_BALANCE_LOG (
    log_id      SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL
        REFERENCES "USER"(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    trade_id    INTEGER
        REFERENCES TRADE(trade_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    change      DECIMAL(10,2) NOT NULL,
    -- 正數：餘額增加；負數：餘額減少

    reason      VARCHAR(50) NOT NULL,
    -- 'TRADE_PAYMENT', 'MANUAL_ADJUST', ...

    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Indexes
-- =========================================================
-- Basic indexes
CREATE INDEX idx_user_status       ON "USER"(status);
CREATE INDEX idx_ticket_owner      ON TICKET(owner_id);
CREATE INDEX idx_ticket_eventtime  ON TICKET(eventtime_id);
CREATE INDEX idx_listing_user      ON LISTING(user_id);
CREATE INDEX idx_listing_event     ON LISTING(event_id);
CREATE INDEX idx_listing_ticket_listing ON LISTING_TICKET(listing_id);
CREATE INDEX idx_listing_ticket_ticket  ON LISTING_TICKET(ticket_id);
CREATE INDEX idx_trade_listing     ON TRADE(listing_id);
CREATE INDEX idx_tp_user           ON TRADE_PARTICIPANT(user_id);
CREATE INDEX idx_tt_ticket         ON TRADE_TICKET(ticket_id);
CREATE INDEX idx_ubl_user          ON USER_BALANCE_LOG(user_id);

-- Composite indexes for common query patterns
CREATE INDEX idx_listing_status_type ON LISTING(status, type);
CREATE INDEX idx_listing_event_status ON LISTING(event_id, status);
CREATE INDEX idx_ticket_status ON TICKET(status);
CREATE INDEX idx_ticket_owner_status ON TICKET(owner_id, status);
CREATE INDEX idx_trade_status ON TRADE(status);

-- Indexes for time-based sorting (DESC for recent items)
CREATE INDEX idx_listing_created_desc ON LISTING(created_at DESC);
CREATE INDEX idx_trade_created_desc ON TRADE(created_at DESC);

-- Index for user balance log trade lookups
CREATE INDEX idx_ubl_trade ON USER_BALANCE_LOG(trade_id) WHERE trade_id IS NOT NULL;

-- Index for event time queries
CREATE INDEX idx_eventtime_start ON EVENTTIME(start_time);

-- Partial indexes for active records (most common queries)
CREATE INDEX idx_listing_active ON LISTING(event_id, created_at DESC) 
    WHERE status = 'Active';
CREATE INDEX idx_ticket_active ON TICKET(owner_id, eventtime_id) 
    WHERE status = 'Active';
CREATE INDEX idx_trade_pending ON TRADE(listing_id, created_at DESC)
    WHERE status = 'Pending';

-- =========================================================
-- Triggers
-- =========================================================
-- Trigger function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to TRADE table
CREATE TRIGGER update_trade_updated_at 
    BEFORE UPDATE ON TRADE
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();