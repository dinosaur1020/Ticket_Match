# Ticket Match - 併行操作展示指南

本文件說明如何展示系統的併行控制功能，證明系統能正確處理多使用者同時操作的情境。

## 🎯 展示目標

證明系統具備以下特性：
1. **ACID 交易管理**：多個操作作為一個原子單位執行
2. **併行控制**：防止雙重消費（Double Spending）
3. **資料一致性**：即使在併發情況下，資料庫仍保持一致

## 📋 準備工作

### 1. 確保系統正常運行

```bash
# 確認資料庫已初始化
npm run init-db:seed

# 啟動開發伺服器
npm run dev
```

### 2. 準備兩個瀏覽器視窗

可以使用以下任一方式：
- 兩個不同的瀏覽器（Chrome + Firefox）
- 一個正常視窗 + 一個無痕視窗
- 同一瀏覽器的兩個獨立視窗（需要不同的使用者 profile）

## 🧪 測試案例 1：票券交易競爭

### 情境說明
Alice 和 Bob 同時嘗試購買 Charlie 的同一張票，系統應確保只有一人能成功。

### 步驟

#### 視窗 A（Alice）
1. 訪問 http://localhost:3000/login
2. 登入為 `alice`（密碼：`password123`）
3. 記下餘額（應該是 $15,000.00）
4. 前往「活動列表」
5. 點擊「五月天 人生無限公司 巡迴演唱會」
6. 找到一個售票貼文（例如 Charlie 的貼文）

#### 視窗 B（Bob）
1. 訪問 http://localhost:3000/login（使用不同瀏覽器或無痕視窗）
2. 登入為 `bob`（密碼：`password123`）
3. 記下餘額（應該是 $12,000.00）
4. 前往「活動列表」
5. 點擊「五月天 人生無限公司 巡迴演唱會」
6. 找到同樣的售票貼文

#### 併行操作
1. 在視窗 A，點擊貼文查看詳情
2. 在視窗 B，同樣點擊貼文查看詳情
3. **同時**在兩個視窗中發起交易（若系統提供此功能）
4. 嘗試**同時**確認交易

### 預期結果

✅ **正確的結果：**
- 只有一個使用者（先確認的）能成功完成交易
- 另一個使用者會收到錯誤訊息：「票券已被鎖定」或「票券不再可用」
- 成功的使用者：
  - 票券所有權轉移
  - 餘額減少
  - 交易狀態變為「已完成」
- 失敗的使用者：
  - 餘額不變
  - 沒有獲得票券

❌ **錯誤的結果（不應發生）：**
- 兩個使用者都成功
- 票券被重複銷售
- 餘額計算錯誤

## 🧪 測試案例 2：交易雙方同時確認

### 情境說明
展示交易需要雙方確認，且當雙方都確認後才會執行票券轉移和金額變動。

### 步驟

#### 視窗 A（Alice - 賣方）
1. 登入為 `alice`
2. 前往「我的票券管理」→「我的交易」
3. 找到一筆「待確認」的交易
4. **準備**點擊「確認交易」但先不要點

#### 視窗 B（買方 - 假設為 Bob）
1. 登入為對應的買方
2. 前往「我的票券管理」→「我的交易」
3. 找到相同的「待確認」交易
4. **準備**點擊「確認交易」但先不要點

#### 併行操作
1. 同時在兩個視窗點擊「確認交易」
2. 觀察結果

### 預期結果

✅ **正確的結果：**
- 第一個確認的使用者看到「等待對方確認」訊息
- 第二個確認的使用者（完成最後確認）看到交易成功訊息
- 票券所有權正確轉移
- 雙方餘額正確更新：
  - 賣方：餘額 +agreed_price
  - 買方：餘額 -agreed_price
- 交易狀態更新為「Completed」
- 票券狀態更新為「Completed」
- 在 `user_balance_log` 中正確記錄兩筆日誌

## 🔍 後端驗證

### 查看資料庫狀態

```sql
-- 查看票券狀態
SELECT ticket_id, owner_id, status FROM ticket WHERE ticket_id = [票券ID];

-- 查看交易狀態
SELECT * FROM trade WHERE trade_id = [交易ID];

-- 查看餘額變動記錄
SELECT * FROM user_balance_log WHERE trade_id = [交易ID];

-- 查看使用者餘額
SELECT user_id, username, balance FROM "user" WHERE username IN ('alice', 'bob', 'charlie');
```

### 檢查併行控制日誌

開發模式下，終端會顯示 SQL 查詢日誌：

```
Executed query { text: 'UPDATE ticket SET status=...', duration: 5, rows: 1 }
```

觀察 `rows` 數值：
- `rows: 1` = 成功鎖定票券
- `rows: 0` = 票券已被其他交易鎖定（併行控制生效）

## 🏗️ 技術實作細節

### 樂觀鎖定（Optimistic Locking）

```typescript
// 在確認交易時
const lockResult = await client.query(
  `UPDATE ticket
   SET status = 'Locked'
   WHERE ticket_id = $1 AND owner_id = $2 AND status = 'Active'
   RETURNING ticket_id`,
  [ticketId, fromUserId]
);

if (lockResult.rowCount === 0) {
  throw new Error('票券已被鎖定或不再可用');
}
```

### 交易隔離

```typescript
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### FOR UPDATE 鎖定

```sql
SELECT t.*, l.listing_id, l.type as listing_type
FROM trade t
JOIN listing l ON t.listing_id = l.listing_id
WHERE t.trade_id = $1 AND t.status = 'Pending'
FOR UPDATE;  -- 行級鎖定，防止其他交易同時修改
```

## 📊 性能測試

### 索引效能比較

```sql
-- 關閉索引
DROP INDEX idx_ticket_owner;
DROP INDEX idx_listing_event;

-- 執行查詢並計時
EXPLAIN ANALYZE
SELECT t.*, e.event_name, et.start_time
FROM ticket t
JOIN eventtime et ON t.eventtime_id = et.eventtime_id
JOIN event e ON et.event_id = e.event_id
WHERE t.owner_id = 1;

-- 重建索引
CREATE INDEX idx_ticket_owner ON TICKET(owner_id);
CREATE INDEX idx_listing_event ON LISTING(event_id);

-- 再次執行相同查詢
EXPLAIN ANALYZE [same query];

-- 比較執行時間差異
```

### 預期結果
- **無索引**：查詢時間較長（Sequential Scan）
- **有索引**：查詢時間大幅縮短（Index Scan）

## ✅ 驗收標準

系統應該通過以下所有測試：

- [ ] 兩個使用者同時嘗試交易同一張票時，只有一人成功
- [ ] 失敗的使用者收到明確的錯誤訊息
- [ ] 資料庫中的票券狀態正確（不會出現重複所有權）
- [ ] 餘額計算正確（不會憑空產生或消失金額）
- [ ] 交易日誌完整記錄所有變動
- [ ] 系統在高併發下保持穩定
- [ ] 交易要麼完全成功，要麼完全失敗（原子性）

## 🎓 課程相關說明

本系統完整實作了資料庫課程中的核心概念：

1. **ACID 特性**
   - Atomicity: 使用 BEGIN/COMMIT/ROLLBACK
   - Consistency: 外鍵約束、CHECK 約束
   - Isolation: Transaction isolation levels
   - Durability: PostgreSQL WAL

2. **併行控制**
   - Optimistic Locking: WHERE status='Active'
   - Pessimistic Locking: FOR UPDATE
   - Row-level Locking

3. **交易管理**
   - 多步驟操作的原子性
   - 錯誤處理與 rollback
   - 交易日誌追蹤

4. **性能優化**
   - 索引策略
   - 查詢優化
   - Connection pooling

## 📝 展示腳本

### 開場
"這是一個票券交易平台，支援多人同時操作。我將展示當兩個使用者同時嘗試購買同一張票時，系統如何確保資料一致性。"

### 展示過程
1. "首先，我開啟兩個瀏覽器視窗，分別登入為 Alice 和 Bob。"
2. "兩人都看到 Charlie 正在出售一張五月天的票。"
3. "現在，Alice 和 Bob **同時**點擊購買。"
4. "請注意，只有一人成功，另一人收到『票券已被鎖定』的訊息。"
5. "這證明我們的系統正確實作了併行控制。"

### 技術說明
"系統使用 PostgreSQL 的交易機制，配合樂觀鎖定策略。當更新票券狀態時，我們檢查票券是否仍為 'Active'。如果另一個交易已經鎖定了票券，rowCount 會是 0，系統就會 rollback 整個交易。"

---

**提醒**：展示前請確保資料庫有足夠的測試資料，且至少有幾筆待確認的交易。

