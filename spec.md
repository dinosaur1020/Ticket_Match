

📘 Ticket Match — System Specification (Final Version)

Database Management (114-1) Final Project – Group 14
(Fully aligned with project requirements  ￼)

⸻

0. Introduction

Ticket Match 是一個提供使用者進行 售票、收票與換票 的票券撮合平台。
為符合實際世界需求、資料規模與課程規範，本系統具有：
	•	完整前後端（UI + API）
	•	以關聯式資料庫（PostgreSQL）為核心
	•	NoSQL（MongoDB）作為行為資料儲存
	•	多人併行操作（至少兩個前端同時連線）
	•	交易管理、併行控制、索引優化
	•	大量資料（Listing、Ticket、Trade…可突破萬筆）

本文件詳細說明系統架構、資料庫 schema、正規化、主要流程與 SQL/NoSQL 查詢。

⸻

1. System Analysis

(對應書面報告必備 Section，符合說明規格  ￼)

1.1 User Roles

角色	功能	是否需要介面
一般使用者 (User)	查詢活動、管理票券、建立貼文、進行交易	✔
業務經營者 (Business Operator)	建立活動、表演者、場次資訊	✔
資料分析師 (Analyst)	分析行為資料與交易資料	✖（直接查 DB）
系統管理者 (Admin)	管理使用者與資料品質	✖

分析師與系統管理者不需前端介面（課程明文允許） ￼。

⸻

1.2 System Features

✔ 一般使用者功能（至少 5 項）
	1.	登入／註冊
	2.	新增 / 修改 / 取消 Listing
	3.	管理自己的 Ticket
	4.	發起交易（Trade）
	5.	雙方確認交易、查看交易紀錄
	6.	查詢活動與場次

✔ 業務經營者功能（至少 5 項）
	1.	新增／修改／刪除活動 Event
	2.	新增／修改 EventTime（活動場次）
	3.	新增表演者資料（EVENT_PERFORMER）
	4.	檢視平台所有 Listing 與交易狀態
	5.	管理詐欺帳號（停權 user）

✔ 分析功能（至少 5 項）
	1.	活動熱度排行（Listing 數量）
	2.	交易總額（Trade.agreed_price）
	3.	使用者收入排行（user_balance_log）
	4.	換票流動路徑（TRADE_TICKET）
	5.	最熱門搜尋關鍵字（MongoDB）

⸻

2. System Architecture (Client–Server)

符合課程要求的 client-server 架構 ￼：

[Front-End CLI]
     |
     |  REST API / WebSocket
     |
[Back-End Server (Node.js)]
     | \
     |  \__ PostgreSQL   (主資料庫：交易資料)
     |
      \__ MongoDB       (NoSQL：搜尋/點擊行為)

	•	前端：圖形界面
	•	後端：單一 API server 處理所有 request
	•	同時開兩個 CLI 可展示「併行控制」

⸻

3. Database Design

3.1 ER Diagram (文字敘述)

主要關聯：
	•	EVENT ⟶ EVENTTIME (1:N)
	•	EVENT ⟶ EVENT_PERFORMER (1:N)
	•	EVENTTIME ⟶ TICKET (1:N)
	•	USER ⟶ TICKET (1:N)
	•	USER ⟶ LISTING (1:N)
	•	LISTING ⟶ TRADE (1:1)（Version A）
	•	TRADE ⟶ TRADE_PARTICIPANT (1:N)
	•	TRADE ⟶ TRADE_TICKET (1:N)
	•	USER ⟶ USER_BALANCE_LOG (1:N)

3.2 Relational Schema (完整)

USER(user_id, username, password_hash, email, balance, status, created_at)
USER_ROLE(user_id, role)
EVENT(event_id, event_name, venue, description)
EVENTTIME(eventtime_id, event_id, start_time, end_time)
EVENT_PERFORMER(event_id, performer)
TICKET(ticket_id, eventtime_id, owner_id, seat_area, seat_number, price, status)
LISTING(listing_id, user_id, event_id, event_date, content, status, type)
TRADE(trade_id, listing_id, status, agreed_price, created_at, updated_at)
TRADE_PARTICIPANT(trade_id, user_id, role, confirmed, confirmed_at)
TRADE_TICKET(trade_id, ticket_id, from_user_id, to_user_id)
USER_BALANCE_LOG(log_id, user_id, trade_id, change, reason, created_at)


⸻

4. Normalization Analysis

符合 3NF / BCNF：

雙表	說明
eventtime_id 替代自然鍵	避免 (event_id, start_time) duplication
TRADE_TICKET 不存冗餘資料	不重複存 owner / event 資訊
UserRole 正規化成多值表	符合 BCNF
Price、seat 等均依賴 ticket_id	無傳遞依賴

無複合欄位、無多值欄位，全表皆符合 最少冗餘與更新一致性原則 ￼。

⸻

5. Business Logic

5.1 Ticket Lifecycle

Active → Locked → Completed
          ↑
        Canceled
Active → Expired（由排程更新）

5.2 Trade Lifecycle

Pending → Completed
Pending → Canceled
Pending → Disputed
Pending → Expired（活動結束）

5.3 Full Trade Flow (重要)
	1.	貼文建立者 = seller
	2.	買方提出交易 → 建立 TRADE
	3.	TRADE_PARTICIPANT：seller + buyer
	4.	TRADE_TICKET：每張票由誰轉給誰
	5.	雙方 confirmed
	6.	系統自動執行：
	•	更新 TICKET.owner_id
	•	更新 LISTING.status
	•	USER.balance＋USER_BALANCE_LOG
	•	TRADE.status=‘Completed’

⸻

6. Transaction Management（課程高分重點）

本系統大量更新跨多表資料，因此需完整 transaction：

BEGIN;

-- 1. 票券所有權
UPDATE ticket ...

-- 2. log
INSERT INTO user_balance_log ...

-- 3. balance
UPDATE user SET balance = ...

-- 4. listing
UPDATE listing SET status='Completed' ...

COMMIT;

6.1 避免 Double Spend

UPDATE ticket
SET status='Locked'
WHERE ticket_id=:id AND status='Active';

若更新 0 rows → 代表票已被他人鎖定（正確的併行控制示範）。

⸻

7. Indexing & Performance

7.1 Index 設計（有效減少 JOIN 成本）

CREATE INDEX idx_ticket_owner ON TICKET(owner_id);
CREATE INDEX idx_listing_user ON LISTING(user_id);
CREATE INDEX idx_listing_event ON LISTING(event_id);
CREATE INDEX idx_trade_listing ON TRADE(listing_id);
CREATE INDEX idx_tp_user ON TRADE_PARTICIPANT(user_id);
CREATE INDEX idx_tt_ticket ON TRADE_TICKET(ticket_id);
CREATE INDEX idx_ubl_user ON USER_BALANCE_LOG(user_id);

7.2 大量資料測試（課程要求）
	•	TICKET、LISTING 可由 Python script 自動生成 10,000–100,000 筆
	•	TRADE_TICKET、BALANCE_LOG 在真實情境亦可達千筆以上

建立 index 後，可對 runtime 成效進行比較（EXPLAIN ANALYZE）。

⸻

8. SQL Queries（使用者 5 + 分析師 5）

8.1 一般使用者查詢（5）

1. 我的貼文

SELECT * FROM listing WHERE user_id=:uid ORDER BY created_at DESC;

2. 我的票券

SELECT t.*, e.event_name, et.start_time
FROM ticket t
JOIN eventtime et ON t.eventtime_id = et.eventtime_id
JOIN event e ON et.event_id = e.event_id
WHERE owner_id=:uid;

3. 已完成交易

SELECT t.*
FROM trade_participant tp
JOIN trade t ON tp.trade_id=t.trade_id
WHERE tp.user_id=:uid AND t.status='Completed';

4. 票券流轉

SELECT tt.*, t.created_at
FROM trade_ticket tt
JOIN trade t ON t.trade_id = tt.trade_id
WHERE ticket_id=:tid;

5. 餘額紀錄

SELECT * FROM user_balance_log WHERE user_id=:uid ORDER BY created_at DESC;


⸻

8.2 資料分析師查詢（5）

1. 熱門活動（按 listing 排序）

SELECT event_id, COUNT(*) AS listings
FROM listing
GROUP BY event_id
ORDER BY listings DESC;

2. 使用者收入排行

SELECT user_id, SUM(change) AS total
FROM user_balance_log
WHERE change > 0
GROUP BY user_id
ORDER BY total DESC;

3. 換票流動分析

SELECT from_user_id, to_user_id, COUNT(*) AS count
FROM trade_ticket
GROUP BY from_user_id, to_user_id;

4. 活動銷售轉換率

SELECT event_id,
  COUNT(*) FILTER (WHERE status='Active') AS posts,
  COUNT(*) FILTER (WHERE status='Completed') AS completed
FROM listing
GROUP BY event_id;

5. NoSQL（MongoDB）熱門搜尋關鍵字

db.user_activity_log.aggregate([
  {$match:{action:"search"}},
  {$group:{_id:"$keyword",count:{$sum:1}}},
  {$sort:{count:-1}}
])


⸻

9. NoSQL Database Design

Collection：USER_ACTIVITY_LOG

{
  "user_id": 13,
  "action": "search",       // search / click / view_event
  "keyword": "五月天",
  "listing_id": null,
  "timestamp": "2025-12-03T12:30:00"
}

用途：
	•	熱門搜尋字詞
	•	活動曝光度
	•	使用者行為序列模型

符合 NoSQL 的儲存特性（append-only、schema-free、可大量寫入） ￼。

⸻

10. Seed Data Strategy
	•	Event：至少 10–20 筆
	•	EventTime：每個 Event 2–8 筆
	•	Performer：採真實歌手資料更有加分效果
	•	Ticket：隨機產生 5,000+
	•	Listing：至少 3,000
	•	Trade：至少 500
	•	TradeTicket：>2,000（因一筆 trade 可含多張票）

⸻

11. Summary

本 SPEC 完整符合課程規定（包含關聯式 DB、NoSQL、client-server、併行控制、索引、正規化、分析查詢等） ￼，包含：

✔ 系統分析
✔ 資料庫 schema（11 張表）
✔ 正規化說明
✔ 前端與業務流程
✔ 交易管理與併行控制
✔ NoSQL 行為資料庫
✔ 10+ SQL / NoSQL 查詢
✔ 大量資料策略
✔ Index 與效能設計

此為 最終版、可直接提交、可直接放 GitHub SPEC.md、可直接給 Cursor 實作的專業規格書。
