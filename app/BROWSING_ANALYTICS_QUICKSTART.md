# 瀏覽記錄統計功能 - 快速使用指南

## 🚀 快速開始

### 1. 建立 MongoDB 索引（首次使用）

```bash
npm run init-mongo-indexes
```

或直接執行：

```bash
node scripts/init-mongodb-indexes.js
```

### 2. 啟動應用程式

```bash
npm run dev
```

### 3. 開始使用

1. 登入任意測試帳號（如 `alice`，密碼 `password123`）
2. 瀏覽一些活動和貼文來產生數據
3. 前往 `/analytics` 頁面查看統計結果

## 📊 功能說明

### 瀏覽趨勢分析

- 位置：Analytics 頁面 → 「瀏覽趨勢」分頁
- 功能：
  - 查看每日的活動和貼文瀏覽量
  - 可切換時間範圍（7天、30天、90天、全部）
  - 區分活動瀏覽和貼文瀏覽
- 使用時機：了解平台整體流量趨勢

### 熱門瀏覽內容

- 位置：Analytics 頁面 → 「熱門瀏覽內容」分頁
- 功能：
  - 顯示最多人瀏覽的活動排行榜
  - 顯示最多人瀏覽的貼文排行榜
  - 顯示瀏覽次數和唯一使用者數
- 使用時機：找出最受歡迎的內容

### 我的瀏覽記錄

- 位置：Analytics 頁面 → 「我的瀏覽記錄」分頁
- 功能：
  - 查看個人的瀏覽歷史
  - 按時間倒序排列
  - 顯示最近 50 筆記錄
- 使用時機：回顧自己看過的活動和貼文

## 🔧 技術細節

### 自動追蹤

系統會自動記錄已登入使用者的以下行為：
- 訪問 `/events/[id]` → 記錄 `view_event`
- 訪問 `/listings/[id]` → 記錄 `view_listing`

### API 端點

```bash
# 瀏覽趨勢（可選參數：days=7|30|90）
GET /api/analytics/browsing-trends?days=7

# 熱門內容（可選參數：limit=10, type=event|listing|both）
GET /api/analytics/popular-views?limit=10

# 個人瀏覽記錄（需認證，可選參數：limit=50）
GET /api/analytics/user-browsing?limit=50
```

### 資料結構

MongoDB Collection: `user_activity_log`

```json
{
  "user_id": 1,
  "action": "view_event",
  "event_id": 5,
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

## 🧪 測試建議

### 產生測試數據

1. 登入為 `alice`
2. 瀏覽多個不同的活動
3. 瀏覽多個不同的貼文
4. 登出並登入為 `bob`
5. 重複步驟 2-3
6. 前往 `/analytics` 查看統計結果

### 驗證功能

**瀏覽趨勢：**
- 切換不同時間範圍，確認數據正確顯示
- 檢查總瀏覽量 = 活動瀏覽 + 貼文瀏覽

**熱門內容：**
- 多次瀏覽同一個活動
- 確認該活動出現在熱門排行榜
- 驗證瀏覽次數和唯一使用者數正確

**個人記錄：**
- 檢查是否顯示自己的瀏覽記錄
- 確認按時間倒序排列
- 驗證內容類型標籤正確

## ⚠️ 注意事項

1. **隱私保護**：只有已登入使用者會被追蹤
2. **效能影響**：記錄操作為非同步，不會影響頁面載入速度
3. **資料量**：建議定期清理舊的瀏覽記錄（可擴展功能）
4. **索引**：首次使用前請務必建立 MongoDB 索引

## 📚 詳細文檔

完整功能說明請參考：`BROWSING_ANALYTICS_FEATURE.md`

## 🐛 常見問題

### Q: 看不到任何瀏覽記錄？
A: 
- 確認已登入
- 確認已瀏覽一些活動或貼文
- 檢查 MongoDB 連線是否正常

### Q: 統計數據不準確？
A: 
- 檢查 MongoDB 索引是否已建立
- 確認系統時間設定正確
- 查看控制台是否有錯誤訊息

### Q: 如何清理舊數據？
A: 
```javascript
// 在 MongoDB shell 或 Compass 中執行
db.user_activity_log.deleteMany({
  timestamp: { $lt: new Date('2025-01-01') }
})
```

### Q: 可以追蹤未登入使用者嗎？
A: 
目前不支援。這是基於隱私考量的設計決策。如需追蹤未登入使用者，可以：
1. 使用 session ID 或 cookie
2. 使用 IP 地址（需注意 GDPR 合規性）
3. 使用第三方分析工具（如 Google Analytics）

