# 瀏覽記錄統計功能

## 功能概述

此功能使用 MongoDB 記錄和分析使用者對活動（Events）和貼文（Listings）的瀏覽行為，提供多維度的統計分析。

## 主要功能

### 1. 自動記錄瀏覽行為

系統會自動追蹤已登入使用者的瀏覽行為：
- 瀏覽活動詳情頁面（`/events/[id]`）
- 瀏覽貼文詳情頁面（`/listings/[id]`）

記錄內容包括：
- 使用者 ID
- 行為類型（`view_event` 或 `view_listing`）
- 內容 ID（活動 ID 或貼文 ID）
- 時間戳記

### 2. 瀏覽趨勢分析

**API Endpoint**: `/api/analytics/browsing-trends`

**參數**:
- `days` (選填): 查詢最近 N 天的資料，不提供則查詢全部時間

**功能**:
- 按日期統計瀏覽量
- 區分活動瀏覽和貼文瀏覽
- 顯示總瀏覽量
- 支援時間範圍篩選（7天、30天、90天、全部）

**回應格式**:
```json
{
  "title": "瀏覽趨勢分析",
  "period": "最近 7 天",
  "data": [
    {
      "date": "2025-12-03",
      "event_views": 45,
      "listing_views": 32,
      "total_views": 77
    }
  ]
}
```

### 3. 熱門內容排行

**API Endpoint**: `/api/analytics/popular-views`

**參數**:
- `limit` (選填): 返回結果數量，預設 10
- `type` (選填): 內容類型（`event`、`listing` 或 `both`），預設 `both`

**功能**:
- 列出最多人瀏覽的活動
- 列出最多人瀏覽的貼文
- 顯示總瀏覽次數
- 顯示唯一使用者數量

**回應格式**:
```json
{
  "title": "熱門內容排行",
  "events": [
    {
      "event_id": 1,
      "event_name": "五月天演唱會",
      "venue": "台北小巨蛋",
      "view_count": 128,
      "unique_users": 85
    }
  ],
  "listings": [
    {
      "listing_id": 5,
      "event_name": "周杰倫演唱會",
      "venue": "高雄巨蛋",
      "listing_type": "Sell",
      "view_count": 95,
      "unique_users": 67
    }
  ]
}
```

### 4. 個人瀏覽記錄

**API Endpoint**: `/api/analytics/user-browsing`

**認證**: 需要登入

**參數**:
- `limit` (選填): 返回結果數量，預設 50

**功能**:
- 查看個人的瀏覽歷史
- 按時間倒序排列
- 包含瀏覽內容的詳細資訊
- 區分活動和貼文

**回應格式**:
```json
{
  "title": "我的瀏覽記錄",
  "data": [
    {
      "action": "view_event",
      "timestamp": "2025-12-03T10:30:00Z",
      "type": "event",
      "id": 1,
      "name": "五月天演唱會",
      "venue": "台北小巨蛋"
    },
    {
      "action": "view_listing",
      "timestamp": "2025-12-03T10:25:00Z",
      "type": "listing",
      "id": 5,
      "name": "周杰倫演唱會",
      "venue": "高雄巨蛋",
      "listing_type": "Sell"
    }
  ]
}
```

## 前端整合

### Analytics 頁面

在 `/analytics` 頁面新增三個分析選項：

1. **瀏覽趨勢**: 
   - 顯示每日瀏覽量趨勢
   - 提供時間範圍選擇器
   - 區分活動和貼文的瀏覽量

2. **熱門瀏覽內容**:
   - 顯示最多人瀏覽的活動排行榜
   - 顯示最多人瀏覽的貼文排行榜
   - 顯示瀏覽次數和唯一使用者數

3. **我的瀏覽記錄**:
   - 顯示個人的瀏覽歷史
   - 按時間倒序排列
   - 顯示內容類型標籤

## 技術實作

### 資料結構

MongoDB Collection: `user_activity_log`

```javascript
{
  user_id: Number,
  action: String, // 'view_event' | 'view_listing'
  event_id: Number (optional),
  listing_id: Number (optional),
  timestamp: Date
}
```

### 索引優化

為提升查詢效能，建立以下索引：
- `{ user_id: 1, timestamp: -1 }` - 複合索引，用於查詢使用者歷史
- `{ action: 1, timestamp: -1 }` - 複合索引，用於按類型查詢
- `{ event_id: 1 }` - 單一索引，用於活動統計
- `{ listing_id: 1 }` - 單一索引，用於貼文統計
- `{ timestamp: -1 }` - 單一索引，用於時間排序

### MongoDB 輔助函數

在 `lib/mongodb.ts` 新增的函數：

- `getBrowsingTrends(days?)`: 查詢瀏覽趨勢數據
- `getPopularContent(contentType, limit)`: 查詢熱門內容
- `getUserBrowsingHistory(userId, limit)`: 查詢使用者瀏覽歷史
- `createIndexes()`: 建立 MongoDB 索引

## 安裝與設定

### 1. 確保 MongoDB 連線

確認 `.env` 或 `.env.local` 檔案中有正確的 MongoDB 連線字串：

```bash
MONGODB_URI=mongodb://localhost:27017/ticket_match
```

### 2. 建立 MongoDB 索引

執行以下指令建立索引以提升查詢效能：

```bash
node scripts/init-mongodb-indexes.js
```

### 3. 啟動應用程式

```bash
npm run dev
```

### 4. 訪問 Analytics 頁面

前往 `/analytics` 查看新增的統計功能。

## 隱私與安全

- 只追蹤已登入使用者的瀏覽行為
- 未登入使用者不會被記錄
- 個人瀏覽記錄需要登入才能查看
- 活動記錄失敗不會影響主要功能

## 效能考量

- 使用 MongoDB 儲存非關鍵性的活動記錄
- 記錄操作為非同步，不阻塞主要請求
- 使用索引優化查詢效能
- Aggregation Pipeline 進行複雜統計

## 未來擴展

可能的功能擴展方向：
- 加入更多瀏覽行為維度（停留時間、來源頁面等）
- 個人化推薦系統
- 瀏覽熱圖分析
- 使用者行為路徑分析
- 匯出統計報表功能

