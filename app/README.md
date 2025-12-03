# Ticket Match - 票券撮合平台

資料庫管理 (114-1) 期末專案 - 第十四組

一個完整的票券交易撮合平台，提供使用者售票、收票與換票功能，支援多人併行操作與完整交易管理。

## 🎯 專案特色

- ✅ **完整的 Client-Server 架構**：Next.js 14+ (React + TypeScript)
- ✅ **PostgreSQL 主資料庫**：11 張正規化資料表 (3NF/BCNF)
- ✅ **MongoDB 行為資料**：使用者搜尋與點擊行為記錄
- ✅ **交易管理與併行控制**：完整的 ACID 交易與防止雙重消費
- ✅ **索引優化**：提升查詢效能的索引策略
- ✅ **即時搜尋**：支援活動、表演者、場地搜尋
- ✅ **數據分析**：5+ 種分析查詢（SQL + MongoDB）
- ✅ **多人併行測試**：支援同時多用戶操作

## 📋 Prerequisites Setup

### PostgreSQL Installation
**macOS (with Homebrew):**
```bash
brew install postgresql
brew services start postgresql
createdb ticket_match
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb ticket_match
```

**Docker (Alternative):**
```bash
docker run --name postgres-ticket -e POSTGRES_DB=ticket_match -e POSTGRES_PASSWORD=your_password -p 5432:5432 -d postgres:14
```

### MongoDB Installation
**macOS (with Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt install mongodb
sudo systemctl start mongodb
```

**Docker (Alternative):**
```bash
docker run --name mongodb-ticket -p 27017:27017 -d mongo:6
```

## 📋 系統需求

- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+
- npm 或 yarn

## 🚀 快速開始

### 1. 環境設定

```bash
# 克隆專案
git clone <repository-url>
cd Ticket_Match-1/app

# 安裝依賴
npm install

# 複製環境變數範例並修改
cp ".env copy.example" .env.local
```

編輯 `.env.local` 並設定你的資料庫連線資訊：

```env
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ticket_match
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ticket_match

# Session Configuration
SESSION_SECRET=your-random-secret-at-least-32-characters-long
```

### 2. 資料庫初始化

```bash
# 建立 PostgreSQL 資料庫（如果尚未建立）
# 注意：如果使用 Docker，資料庫已在容器中建立
createdb ticket_match

# 執行 schema 和 seed data
node scripts/init-db.js --seed
```

如果成功，你會看到：
```
✅ Schema applied successfully
✅ Seed data loaded successfully
📊 Database Statistics:
  user: 9 rows
  event: 15 rows
  ticket: 43 rows
  listing: 23 rows
  ...
```

**建立 MongoDB 索引以解鎖完整分析功能：**

```bash
# 建立 MongoDB 索引（解鎖瀏覽分析、搜尋關鍵字等功能）
node scripts/init-mongodb-indexes.js
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問：http://localhost:3000

## 👤 測試帳號

系統預設提供以下測試帳號（密碼皆為 `password123`）：

**一般使用者：**
- `alice` - 擁有多張票券
- `bob` - 擁有多張票券
- `charlie` - 擁有多張票券

**業務經營者：**
- `operator` - 可建立活動、管理使用者

**管理員：**
- `admin` - 完整管理權限

## 🎭 功能展示

### 使用者功能
1. **註冊/登入**：基本認證系統
2. **瀏覽活動**：搜尋活動、查看場次與貼文
3. **票券管理**：查看自己的票券
4. **建立貼文**：發布售票/收票/換票貼文
5. **發起交易**：與其他使用者進行票券交易
6. **確認交易**：雙方確認後自動完成交易
7. **查看交易記錄**：完整的交易歷史

### 業務經營者功能
1. **建立活動**：新增演唱會、音樂節等活動
2. **新增場次**：為活動新增時間場次
3. **管理表演者**：關聯表演者到活動
4. **查看所有貼文**：平台貼文總覽
5. **管理使用者**：停權/啟用使用者

### 數據分析功能
1. **熱門活動排行**：依貼文數量統計
2. **票券流動分析**：票券轉移路徑
3. **活動轉換率**：貼文完成度分析
4. **熱門搜尋關鍵字**：MongoDB 聚合查詢
5. **瀏覽趨勢分析**：每日活動與貼文瀏覽量統計（新功能）
6. **熱門瀏覽內容**：最多人瀏覽的活動與貼文排行（新功能）
7. **個人瀏覽記錄**：使用者瀏覽歷史追蹤（新功能）

## 🔄 併行操作測試

### 測試場景：兩個使用者同時嘗試購買同一張票

**步驟：**

1. 開啟兩個瀏覽器視窗（或使用無痕模式）
2. 第一個視窗登入為 `alice`
3. 第二個視窗登入為 `bob`
4. 在 alice 的視窗中發起一筆交易
5. 在 bob 的視窗中對同一張票發起交易
6. 兩邊同時點擊「確認交易」

**預期結果：**
- 只有一方能成功完成交易
- 另一方會收到「票券已被鎖定」的錯誤訊息
- 資料庫保持一致性，不會發生雙重消費

### 併行控制實作

系統使用以下機制確保併行操作的安全性：

1. **樂觀鎖定 (Optimistic Locking)**：
```sql
UPDATE ticket
SET status='Locked'
WHERE ticket_id=:id AND status='Active';
-- 檢查 rowCount，若為 0 表示票已被鎖定
```

2. **資料庫交易 (ACID Transaction)**：
```sql
BEGIN;
  -- 鎖定票券
  -- 轉移所有權
  -- 更新餘額
  -- 記錄日誌
COMMIT;
```

3. **FOR UPDATE 鎖定**：在關鍵操作時使用行級鎖

## 📊 資料庫架構

### 主要資料表

- **USER**：使用者資訊與餘額
- **EVENT**：活動資訊
- **EVENTTIME**：活動場次
- **TICKET**：票券（與場次關聯）
- **LISTING**：售票/收票/換票貼文
- **TRADE**：交易記錄
- **TRADE_PARTICIPANT**：交易參與者
- **TRADE_TICKET**：交易涉及的票券
- **USER_BALANCE_LOG**：餘額變動日誌

### 索引策略

**PostgreSQL 索引：**
```sql
CREATE INDEX idx_ticket_owner ON TICKET(owner_id);
CREATE INDEX idx_listing_event ON LISTING(event_id);
CREATE INDEX idx_trade_listing ON TRADE(listing_id);
-- ... 更多索引請參考 schema.sql
```

**MongoDB 索引：**
```javascript
// user_activity_log collection
{ user_id: 1, timestamp: -1 }    // 查詢使用者歷史
{ action: 1, timestamp: -1 }      // 按類型查詢
{ event_id: 1 }                   // 活動統計
{ listing_id: 1 }                 // 貼文統計
{ timestamp: -1 }                 // 時間排序
```

### MongoDB Collection

**user_activity_log**：記錄使用者行為
- 搜尋行為記錄
- 活動瀏覽記錄
- 貼文瀏覽記錄
- 支援複雜的 Aggregation 查詢

## 🔍 API 端點

### 認證
- `POST /api/auth/register` - 註冊
- `POST /api/auth/login` - 登入
- `POST /api/auth/logout` - 登出
- `GET /api/auth/session` - 取得當前會話

### 活動
- `GET /api/events` - 列出活動（支援搜尋）
- `GET /api/events/[id]` - 活動詳情
- `POST /api/events` - 建立活動（需權限）
- `PATCH /api/events/[id]` - 更新活動
- `DELETE /api/events/[id]` - 刪除活動

### 票券
- `GET /api/tickets/my` - 我的票券

### 貼文
- `GET /api/listings` - 列出貼文
- `POST /api/listings` - 建立貼文
- `PATCH /api/listings/[id]` - 更新貼文

### 交易
- `GET /api/trades/my` - 我的交易
- `POST /api/trades` - 建立交易
- `POST /api/trades/[id]/confirm` - 確認交易

### 分析
- `GET /api/analytics/popular-events` - 熱門活動
- `GET /api/analytics/ticket-flow` - 票券流動
- `GET /api/analytics/conversion` - 轉換率
- `GET /api/analytics/search-keywords` - 搜尋關鍵字
- `GET /api/analytics/browsing-trends` - 瀏覽趨勢分析（新增）
- `GET /api/analytics/popular-views` - 熱門瀏覽內容（新增）
- `GET /api/analytics/user-browsing` - 個人瀏覽記錄（新增，需認證）

## 🎨 技術棧

### Frontend
- **Next.js 14+**：App Router
- **React 18**：UI 框架
- **TypeScript**：型別安全
- **Tailwind CSS**：樣式框架

### Backend
- **Next.js API Routes**：RESTful API
- **PostgreSQL**：主要資料庫
- **MongoDB**：行為資料儲存
- **iron-session**：Session 管理
- **bcrypt**：密碼雜湊

## 📝 課程需求對照

| 需求 | 實作 | 位置 |
|------|------|------|
| Client-Server 架構 | ✅ Next.js (Browser ↔ API Routes) | 整個專案 |
| 5+ 使用者功能 | ✅ 7 項功能 | `/dashboard`, `/events` |
| 5+ 業務功能 | ✅ 5 項功能 | `/admin` |
| 5+ 分析查詢 | ✅ 7 項查詢 | `/api/analytics/*` |
| PostgreSQL 正規化 | ✅ 3NF/BCNF | `schema.sql` |
| NoSQL 資料庫 | ✅ MongoDB | `lib/mongodb.ts` |
| 交易管理 | ✅ ACID Transactions | `lib/db.ts`, trade APIs |
| 併行控制 | ✅ Optimistic Locking | `/api/trades/[id]/confirm` |
| 索引優化 | ✅ 8+ 索引 | `schema.sql` |

## 🧪 開發與測試

```bash
# 開發模式
npm run dev

# 建置專案
npm run build

# 啟動生產環境
npm start

# 重新初始化資料庫（警告：會清空所有資料）
node scripts/init-db.js --seed
```

## 📂 專案結構

```
app/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/         # 認證 API
│   │   ├── events/       # 活動 API
│   │   ├── listings/     # 貼文 API
│   │   ├── trades/       # 交易 API
│   │   ├── tickets/      # 票券 API
│   │   ├── admin/        # 管理 API
│   │   └── analytics/    # 分析 API
│   ├── dashboard/        # 使用者儀表板
│   ├── events/           # 活動頁面
│   ├── admin/            # 後台管理
│   ├── analytics/        # 數據分析
│   └── page.tsx          # 首頁
├── components/            # React 元件
│   └── Navigation.tsx    # 導覽列
├── lib/                   # 核心函式庫
│   ├── db.ts             # PostgreSQL 連線
│   ├── mongodb.ts        # MongoDB 連線
│   ├── auth.ts           # 認證工具
│   ├── types.ts          # TypeScript 型別
│   └── hooks/            # React Hooks
├── scripts/               # 資料庫腳本
│   ├── init-db.js        # 初始化腳本
│   └── seed-data.sql     # 種子資料
└── README.md             # 本文件
```

## 🐛 常見問題

### 1. 連不上資料庫
- 確認 PostgreSQL 和 MongoDB 服務正在執行
- 檢查 `.env.local` 的連線設定是否正確
- 確認資料庫已建立：`createdb ticket_match`

### 2. Session 錯誤
- 確認 `SESSION_SECRET` 已在 `.env.local` 中設定
- 長度至少 32 個字元

### 3. 種子資料載入失敗
- 先執行 schema：`node scripts/init-db.js`
- 再載入 seed data：`node scripts/init-db.js --seed`

### 4. Port 3000 已被占用
- Next.js 預設使用 port 3000
- 變更 port：`npm run dev -- -p 3001`
- 或設定環境變數：`PORT=3001 npm run dev`

## 👥 團隊

資料庫管理 114-1 - 第十四組

## 📄 授權

此專案為課程作業，僅供學習使用。

---

**提示**：首次執行請確保 PostgreSQL 和 MongoDB 都已啟動，並正確設定 `.env.local`！
