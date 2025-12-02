-- =========================================================
-- Ticket Match Database Schema
-- 第十四組 - 資料庫管理期末專案
-- =========================================================

-- 依相依順序刪除既有資料表（如果存在）
DROP TABLE IF EXISTS USER_BALANCE_LOG CASCADE;
DROP TABLE IF EXISTS TRADE_TICKET CASCADE;
DROP TABLE IF EXISTS TRADE_PARTICIPANT CASCADE;
DROP TABLE IF EXISTS TRADE CASCADE;
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
    user_id        SERIAL PRIMARY KEY,
    username       VARCHAR(50) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    email          VARCHAR(100) UNIQUE NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'Active',
    -- 'Active', 'Suspended', 'Warning', ...
    balance        DECIMAL(10,2) NOT NULL DEFAULT 10000,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 2. USER_ROLE
-- =========================================================
CREATE TABLE USER_ROLE (
    user_id INTEGER NOT NULL
        REFERENCES "USER"(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    role    VARCHAR(20) NOT NULL,
    -- 'User', 'Admin', ...

    PRIMARY KEY (user_id, role)
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

    UNIQUE (event_id, start_time)
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
    owner_id       INTEGER NOT NULL
        REFERENCES "USER"(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    seat_area      VARCHAR(20) NOT NULL,
    seat_number    VARCHAR(20) NOT NULL,
    price          DECIMAL(10,2) NOT NULL,

    status         VARCHAR(20) NOT NULL DEFAULT 'Active',
    -- 'Active', 'Locked', 'Completed', 'Expired', 'Canceled'

    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 7. LISTING
-- =========================================================
CREATE TABLE LISTING (
    listing_id  SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL
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

    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 8. TRADE
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
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 9. TRADE_PARTICIPANT
-- =========================================================
CREATE TABLE TRADE_PARTICIPANT (
    trade_id      INTEGER NOT NULL
        REFERENCES TRADE(trade_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    user_id       INTEGER NOT NULL
        REFERENCES "USER"(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    role          VARCHAR(20) NOT NULL,
    -- 'buyer', 'seller', 'exchanger'

    confirmed     BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at  TIMESTAMP,

    PRIMARY KEY (trade_id, user_id)
);

-- =========================================================
-- 10. TRADE_TICKET
-- =========================================================
CREATE TABLE TRADE_TICKET (
    trade_id      INTEGER NOT NULL
        REFERENCES TRADE(trade_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    ticket_id     INTEGER NOT NULL
        REFERENCES TICKET(ticket_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    from_user_id  INTEGER NOT NULL
        REFERENCES "USER"(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    to_user_id    INTEGER NOT NULL
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
-- 11. USER_BALANCE_LOG
-- =========================================================
CREATE TABLE USER_BALANCE_LOG (
    log_id      SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL
        REFERENCES "USER"(user_id)
        ON DELETE CASCADE
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
CREATE INDEX idx_user_status       ON "USER"(status);
CREATE INDEX idx_ticket_owner      ON TICKET(owner_id);
CREATE INDEX idx_ticket_eventtime  ON TICKET(eventtime_id);
CREATE INDEX idx_listing_user      ON LISTING(user_id);
CREATE INDEX idx_listing_event     ON LISTING(event_id);
CREATE INDEX idx_trade_listing     ON TRADE(listing_id);
CREATE INDEX idx_tp_user           ON TRADE_PARTICIPANT(user_id);
CREATE INDEX idx_tt_ticket         ON TRADE_TICKET(ticket_id);
CREATE INDEX idx_ubl_user          ON USER_BALANCE_LOG(user_id);