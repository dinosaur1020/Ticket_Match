-- =========================================================
-- Ticket Match - Seed Data
-- Manual seed data with realistic examples
-- =========================================================

-- Clear existing data (in reverse dependency order)
TRUNCATE TABLE user_balance_log CASCADE;
TRUNCATE TABLE trade_ticket CASCADE;
TRUNCATE TABLE trade_participant CASCADE;
TRUNCATE TABLE trade CASCADE;
TRUNCATE TABLE listing CASCADE;
TRUNCATE TABLE ticket CASCADE;
TRUNCATE TABLE event_performer CASCADE;
TRUNCATE TABLE eventtime CASCADE;
TRUNCATE TABLE event CASCADE;
TRUNCATE TABLE user_role CASCADE;
TRUNCATE TABLE "USER" CASCADE;

-- Reset sequences
ALTER SEQUENCE "USER_user_id_seq" RESTART WITH 1;
ALTER SEQUENCE event_event_id_seq RESTART WITH 1;
ALTER SEQUENCE eventtime_eventtime_id_seq RESTART WITH 1;
ALTER SEQUENCE ticket_ticket_id_seq RESTART WITH 1;
ALTER SEQUENCE listing_listing_id_seq RESTART WITH 1;
ALTER SEQUENCE trade_trade_id_seq RESTART WITH 1;
ALTER SEQUENCE user_balance_log_log_id_seq RESTART WITH 1;

-- =========================================================
-- USERS (password for all: "password123")
-- Hash generated with bcrypt, rounds=10
-- =========================================================
INSERT INTO "USER" (username, password_hash, email, status, balance) VALUES
('alice', '$2b$10$psOj32xIbX55J27LFnroG.l4YQgexQtJOPnO7CkNbXV2yfGzQLtc.', 'alice@example.com', 'Active', 15000),
('bob', '$2b$10$psOj32xIbX55J27LFnroG.l4YQgexQtJOPnO7CkNbXV2yfGzQLtc.', 'bob@example.com', 'Active', 12000),
('charlie', '$2b$10$psOj32xIbX55J27LFnroG.l4YQgexQtJOPnO7CkNbXV2yfGzQLtc.', 'charlie@example.com', 'Active', 8000),
('david', '$2b$10$psOj32xIbX55J27LFnroG.l4YQgexQtJOPnO7CkNbXV2yfGzQLtc.', 'david@example.com', 'Active', 20000),
('emma', '$2b$10$psOj32xIbX55J27LFnroG.l4YQgexQtJOPnO7CkNbXV2yfGzQLtc.', 'emma@example.com', 'Active', 5000),
('frank', '$2b$10$psOj32xIbX55J27LFnroG.l4YQgexQtJOPnO7CkNbXV2yfGzQLtc.', 'frank@example.com', 'Active', 18000),
('grace', '$2b$10$psOj32xIbX55J27LFnroG.l4YQgexQtJOPnO7CkNbXV2yfGzQLtc.', 'grace@example.com', 'Suspended', 0),
('admin', '$2b$10$psOj32xIbX55J27LFnroG.l4YQgexQtJOPnO7CkNbXV2yfGzQLtc.', 'admin@example.com', 'Active', 50000),
('operator', '$2b$10$psOj32xIbX55J27LFnroG.l4YQgexQtJOPnO7CkNbXV2yfGzQLtc.', 'operator@example.com', 'Active', 30000);

-- User roles
INSERT INTO user_role (user_id, role) VALUES
(1, 'User'),
(2, 'User'),
(3, 'User'),
(4, 'User'),
(5, 'User'),
(6, 'User'),
(7, 'User'),
(8, 'Admin'),
(9, 'BusinessOperator'),
(9, 'User');

-- =========================================================
-- EVENTS
-- =========================================================
INSERT INTO event (event_name, venue, description) VALUES
('五月天 人生無限公司 巡迴演唱會', '台北小巨蛋', '五月天2025年全新巡迴演唱會，帶來最新專輯《人生無限公司》精彩演出'),
('周杰倫 嘉年華 世界巡迴演唱會', '台北大巨蛋', '周董睽違三年再度開唱，經典歌曲加上全新編曲'),
('蔡依林 Ugly Beauty 2025', '高雄巨蛋', 'Jolin最新巡演，結合時尚與音樂的視聽饗宴'),
('告五人 我們的時代 演唱會', '台北流行音樂中心', '告五人首次大型演唱會，演唱熱門金曲'),
('林俊傑 JJ20 巡迴演唱會', '台北小巨蛋', 'JJ出道20週年紀念演唱會'),
('田馥甄 如果 PLUS 演唱會', '台北小巨蛋', 'Hebe全新主題演唱會'),
('邁向下一章音樂節', '台北大佳河濱公園', '匯集多組人氣樂團的大型音樂節'),
('金曲獎頒獎典禮', '台北流行音樂中心', '第36屆金曲獎頒獎典禮'),
('周興哲 終於了解自由', '台中圓滿劇場', '周興哲2025最新巡迴'),
('徐佳瑩 日全蝕 演唱會', '台北小巨蛋', 'LaLa經典演唱會'),
('草東沒有派對 巡迴演唱會', '台北國際會議中心', '草東睽違已久的全新巡演'),
('韋禮安 而立 世界巡迴演唱會', '台北 Legacy', '韋禮安30歲生日特別企劃'),
('宇宙人 一起去火星 演唱會', '台北 THE WALL', '宇宙人最新專輯同名演唱會'),
('獅子合唱團 LION 演唱會', '台北河岸留言', '獅子合唱團年度公演'),
('魏如萱 末路狂花 演唱會', '台北流行音樂中心', '娃娃全新概念演唱會');

-- =========================================================
-- EVENT PERFORMERS
-- =========================================================
INSERT INTO event_performer (event_id, performer) VALUES
(1, '五月天'),
(1, '陳信宏 (阿信)'),
(1, '石錦航 (石頭)'),
(2, '周杰倫'),
(3, '蔡依林'),
(4, '告五人'),
(4, '雲安'),
(4, '哲謙'),
(5, '林俊傑'),
(6, '田馥甄'),
(7, '草東沒有派對'),
(7, '茄子蛋'),
(7, '告五人'),
(7, '宇宙人'),
(8, '特別來賓'),
(9, '周興哲'),
(10, '徐佳瑩'),
(11, '草東沒有派對'),
(12, '韋禮安'),
(13, '宇宙人'),
(14, '獅子合唱團'),
(15, '魏如萱');

-- =========================================================
-- EVENTTIMES (活動場次)
-- =========================================================
INSERT INTO eventtime (event_id, start_time, end_time) VALUES
-- 五月天
(1, '2025-12-20 19:00:00', '2025-12-20 22:00:00'),
(1, '2025-12-21 19:00:00', '2025-12-21 22:00:00'),
(1, '2025-12-27 19:00:00', '2025-12-27 22:00:00'),
-- 周杰倫
(2, '2026-01-10 19:30:00', '2026-01-10 22:30:00'),
(2, '2026-01-11 19:30:00', '2026-01-11 22:30:00'),
(2, '2026-01-17 19:30:00', '2026-01-17 22:30:00'),
(2, '2026-01-18 19:30:00', '2026-01-18 22:30:00'),
-- 蔡依林
(3, '2026-02-14 19:00:00', '2026-02-14 22:00:00'),
(3, '2026-02-15 19:00:00', '2026-02-15 22:00:00'),
-- 告五人
(4, '2025-12-25 19:00:00', '2025-12-25 21:30:00'),
(4, '2025-12-26 19:00:00', '2025-12-26 21:30:00'),
-- 林俊傑
(5, '2026-03-07 19:00:00', '2026-03-07 22:00:00'),
(5, '2026-03-08 19:00:00', '2026-03-08 22:00:00'),
(5, '2026-03-14 19:00:00', '2026-03-14 22:00:00'),
-- 田馥甄
(6, '2026-04-20 19:00:00', '2026-04-20 22:00:00'),
(6, '2026-04-21 19:00:00', '2026-04-21 22:00:00'),
-- 音樂節
(7, '2026-05-01 14:00:00', '2026-05-01 22:00:00'),
(7, '2026-05-02 14:00:00', '2026-05-02 22:00:00'),
-- 金曲獎
(8, '2026-06-28 18:00:00', '2026-06-28 23:00:00'),
-- 周興哲
(9, '2026-02-20 19:00:00', '2026-02-20 21:30:00'),
(9, '2026-02-21 19:00:00', '2026-02-21 21:30:00'),
-- 徐佳瑩
(10, '2026-03-21 19:00:00', '2026-03-21 22:00:00'),
(10, '2026-03-22 19:00:00', '2026-03-22 22:00:00'),
-- 草東
(11, '2026-04-10 19:00:00', '2026-04-10 21:30:00'),
-- 韋禮安
(12, '2026-05-15 20:00:00', '2026-05-15 22:30:00'),
-- 宇宙人
(13, '2026-06-05 20:00:00', '2026-06-05 22:00:00'),
-- 獅子
(14, '2026-07-12 20:00:00', '2026-07-12 22:00:00'),
-- 魏如萱
(15, '2026-08-08 19:00:00', '2026-08-08 22:00:00');

-- =========================================================
-- TICKETS (票券)
-- =========================================================
INSERT INTO ticket (eventtime_id, owner_id, seat_area, seat_number, price, status) VALUES
-- 五月天 12/20 (Alice has tickets)
(1, 1, 'A區', 'A1-01', 3200, 'Active'),
(1, 1, 'A區', 'A1-02', 3200, 'Active'),
(1, 2, 'B區', 'B3-15', 2800, 'Active'),
(1, 3, 'C區', 'C5-20', 2200, 'Active'),
(1, 4, 'A區', 'A2-10', 3200, 'Active'),
-- 五月天 12/21 (Bob has tickets)
(2, 2, 'A區', 'A3-05', 3200, 'Active'),
(2, 2, 'A區', 'A3-06', 3200, 'Active'),
(2, 5, 'B區', 'B2-12', 2800, 'Active'),
(2, 6, 'C區', 'C4-18', 2200, 'Active'),
-- 五月天 12/27
(3, 1, 'A區', 'A1-15', 3200, 'Active'),
(3, 3, 'B區', 'B1-08', 2800, 'Active'),
(3, 4, 'C區', 'C2-25', 2200, 'Active'),
-- 周杰倫 (高價票)
(4, 2, 'VIP區', 'V1-01', 8800, 'Active'),
(4, 3, 'VIP區', 'V1-02', 8800, 'Active'),
(4, 4, 'A區', 'A1-20', 5800, 'Active'),
(5, 1, 'A區', 'A2-15', 5800, 'Active'),
(5, 5, 'B區', 'B3-10', 4200, 'Active'),
(6, 6, 'VIP區', 'V2-05', 8800, 'Active'),
-- 蔡依林
(8, 1, 'A區', 'A1-10', 4200, 'Active'),
(8, 2, 'A區', 'A1-11', 4200, 'Active'),
(9, 3, 'B區', 'B2-20', 3200, 'Active'),
-- 告五人
(10, 4, 'A區', 'A1-05', 2800, 'Active'),
(10, 5, 'A區', 'A1-06', 2800, 'Active'),
(11, 6, 'B區', 'B1-12', 2200, 'Active'),
-- 林俊傑
(12, 1, 'VIP區', 'V1-08', 6800, 'Active'),
(13, 2, 'A區', 'A2-18', 4800, 'Active'),
(14, 3, 'B區', 'B3-22', 3800, 'Active'),
-- 田馥甄
(15, 4, 'A區', 'A1-12', 3800, 'Active'),
(16, 5, 'A區', 'A2-09', 3800, 'Active'),
-- 音樂節
(17, 1, '搖滾區', 'R-001', 2800, 'Active'),
(17, 2, '搖滾區', 'R-002', 2800, 'Active'),
(17, 3, '一般區', 'G-150', 1800, 'Active'),
(18, 4, '搖滾區', 'R-050', 2800, 'Active'),
-- 金曲獎
(19, 5, 'VIP區', 'V1-01', 12000, 'Active'),
-- 其他演唱會
(20, 6, 'A區', 'A1-08', 2800, 'Active'),
(21, 1, 'A區', 'A1-15', 2800, 'Active'),
(22, 2, 'B區', 'B2-10', 2200, 'Active'),
(23, 3, 'A區', 'A1-20', 3200, 'Active'),
(24, 4, 'A區', 'A1-05', 1800, 'Active'),
(25, 5, 'A區', 'A2-12', 1500, 'Active'),
(26, 6, 'A區', 'A1-18', 2200, 'Active'),
(27, 1, 'A區', 'A1-25', 3200, 'Active');

-- =========================================================
-- LISTINGS (貼文)
-- =========================================================
INSERT INTO listing (user_id, event_id, event_date, content, status, type) VALUES
-- Alice's listings
(1, 1, '2025-12-20 19:00:00', '割愛轉讓五月天A區2連號，原價出售！', 'Active', 'Sell'),
(1, 3, '2025-12-27 19:00:00', '徵求五月天12/27 B區票券，價格可議', 'Active', 'Buy'),
(1, 2, '2026-01-10 19:30:00', '周杰倫A區1張，可換五月天任一場', 'Active', 'Exchange'),
-- Bob's listings
(2, 2, '2026-01-10 19:30:00', '周杰倫VIP區1張，高價出售', 'Active', 'Sell'),
(2, 1, '2025-12-21 19:00:00', '五月天12/21 A區連號2張，誠心售出', 'Active', 'Sell'),
(2, 3, '2026-02-14 19:00:00', '徵蔡依林情人節場次票1張', 'Active', 'Buy'),
-- Charlie's listings
(3, 1, '2025-12-20 19:00:00', '五月天C區1張，便宜賣', 'Completed', 'Sell'),
(3, 2, '2026-01-10 19:30:00', 'VIP區1張出售，可議價', 'Active', 'Sell'),
(3, 4, '2025-12-25 19:00:00', '告五人聖誕場，2張一起賣', 'Active', 'Sell'),
-- David's listings  
(4, 5, '2026-03-07 19:00:00', '林俊傑演唱會B區票，原價轉讓', 'Active', 'Sell'),
(4, 1, '2025-12-20 19:00:00', '徵五月天A區1張，價格好談', 'Active', 'Buy'),
(4, 7, '2026-05-01 14:00:00', '音樂節首日票1張，搖滾區', 'Active', 'Sell'),
-- Emma's listings
(5, 2, '2026-01-11 19:30:00', '徵周杰倫任一場次，B區即可', 'Active', 'Buy'),
(5, 4, '2025-12-25 19:00:00', '告五人票券出售', 'Active', 'Sell'),
(5, 8, '2026-06-28 18:00:00', '金曲獎VIP票，高價出售', 'Active', 'Sell'),
-- Frank's listings
(6, 1, '2025-12-21 19:00:00', '五月天C區1張，售1800', 'Active', 'Sell'),
(6, 2, '2026-01-17 19:30:00', '周杰倫VIP區，換五月天任一場VIP', 'Active', 'Exchange'),
(6, 3, '2026-02-14 19:00:00', 'Jolin情人節場，2張連號出售', 'Active', 'Sell'),
-- More listings for analytics
(1, 5, '2026-03-07 19:00:00', 'JJ演唱會A區票1張', 'Active', 'Sell'),
(2, 6, '2026-04-20 19:00:00', 'Hebe票券轉讓', 'Active', 'Sell'),
(3, 7, '2026-05-01 14:00:00', '音樂節票2張', 'Active', 'Sell'),
(4, 9, '2026-02-20 19:00:00', '周興哲演唱會', 'Active', 'Sell'),
(5, 10, '2026-03-21 19:00:00', 'LaLa演唱會票', 'Active', 'Sell');

-- =========================================================
-- TRADES (交易)
-- =========================================================
INSERT INTO trade (listing_id, status, agreed_price, created_at) VALUES
-- Completed trade
(7, 'Completed', 2200, NOW() - INTERVAL '5 days'),
-- Pending trades
(1, 'Pending', 6400, NOW() - INTERVAL '2 days'),
(5, 'Pending', 6400, NOW() - INTERVAL '1 day'),
(8, 'Pending', 8800, NOW() - INTERVAL '3 hours'),
-- Canceled trade
(9, 'Canceled', 5600, NOW() - INTERVAL '7 days');

-- =========================================================
-- TRADE PARTICIPANTS
-- =========================================================
INSERT INTO trade_participant (trade_id, user_id, role, confirmed, confirmed_at) VALUES
-- Trade 1 (Completed)
(1, 3, 'seller', TRUE, NOW() - INTERVAL '5 days'),
(1, 5, 'buyer', TRUE, NOW() - INTERVAL '5 days'),
-- Trade 2 (Pending - Alice selling)
(2, 1, 'seller', TRUE, NOW() - INTERVAL '2 days'),
(2, 6, 'buyer', FALSE, NULL),
-- Trade 3 (Pending - Bob selling)
(3, 2, 'seller', TRUE, NOW() - INTERVAL '1 day'),
(3, 4, 'buyer', FALSE, NULL),
-- Trade 4 (Pending - Charlie selling VIP)
(4, 3, 'seller', FALSE, NULL),
(4, 1, 'buyer', TRUE, NOW() - INTERVAL '2 hours'),
-- Trade 5 (Canceled)
(5, 3, 'seller', FALSE, NULL),
(5, 2, 'buyer', FALSE, NULL);

-- =========================================================
-- TRADE TICKETS (哪些票在交易中)
-- =========================================================
INSERT INTO trade_ticket (trade_id, ticket_id, from_user_id, to_user_id) VALUES
-- Trade 1 (Completed - Charlie sold to Emma)
(1, 4, 3, 5),
-- Trade 2 (Pending - Alice selling to Frank)
(2, 1, 1, 6),
(2, 2, 1, 6),
-- Trade 3 (Pending - Bob selling to David)
(3, 6, 2, 4),
(3, 7, 2, 4),
-- Trade 4 (Pending - Charlie selling to Alice)
(4, 14, 3, 1);

-- =========================================================
-- USER BALANCE LOG (completed trade history)
-- =========================================================
INSERT INTO user_balance_log (user_id, trade_id, change, reason, created_at) VALUES
-- Trade 1 completed
(3, 1, 2200, 'TRADE_PAYMENT', NOW() - INTERVAL '5 days'),
(5, 1, -2200, 'TRADE_PAYMENT', NOW() - INTERVAL '5 days'),
-- Initial balance adjustments
(1, NULL, 15000, 'INITIAL_BALANCE', NOW() - INTERVAL '30 days'),
(2, NULL, 12000, 'INITIAL_BALANCE', NOW() - INTERVAL '30 days'),
(3, NULL, 8000, 'INITIAL_BALANCE', NOW() - INTERVAL '30 days'),
(4, NULL, 20000, 'INITIAL_BALANCE', NOW() - INTERVAL '30 days'),
(5, NULL, 5000, 'INITIAL_BALANCE', NOW() - INTERVAL '30 days'),
(6, NULL, 18000, 'INITIAL_BALANCE', NOW() - INTERVAL '30 days'),
(8, NULL, 50000, 'INITIAL_BALANCE', NOW() - INTERVAL '30 days'),
(9, NULL, 30000, 'INITIAL_BALANCE', NOW() - INTERVAL '30 days');

-- =========================================================
-- Data validation
-- =========================================================
SELECT 'Seed data loaded successfully!' as status;
SELECT COUNT(*) as user_count FROM "USER";
SELECT COUNT(*) as event_count FROM event;
SELECT COUNT(*) as eventtime_count FROM eventtime;
SELECT COUNT(*) as ticket_count FROM ticket;
SELECT COUNT(*) as listing_count FROM listing;
SELECT COUNT(*) as trade_count FROM trade;

