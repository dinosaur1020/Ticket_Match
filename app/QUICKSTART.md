# Ticket Match - 快速開始指南

5 分鐘內啟動並運行系統。

## ⚡ 快速設置

### 1. 前置準備（5 分鐘）

確保已安裝：
```bash
# 檢查 Node.js
node --version  # 需要 18+

# 檢查 PostgreSQL
psql --version  # 需要 14+

# 檢查 MongoDB
mongod --version  # 需要 6+
```

### 2. 啟動資料庫服務

```bash
# macOS (使用 Homebrew)
brew services start postgresql
brew services start mongodb-community

# Linux
sudo systemctl start postgresql
sudo systemctl start mongod

# Windows
# 從服務管理器啟動 PostgreSQL 和 MongoDB
```

### 3. 專案設置（2 分鐘）

```bash
# 進入專案目錄
cd app

# 安裝依賴
npm install

# 初始化資料庫（含種子資料）
npm run init-db:seed
```

### 4. 啟動應用

```bash
npm run dev
```

訪問：**http://localhost:3000**

## 🎮 立即體驗

### 登入測試帳號

使用以下任一帳號登入（密碼皆為 `password123`）：

| 帳號 | 角色 | 特色 |
|------|------|------|
| `alice` | 一般使用者 | 擁有多張票券 |
| `bob` | 一般使用者 | 擁有高價 VIP 票 |
| `charlie` | 一般使用者 | 有售票貼文 |
| `operator` | 業務經營者 | 可管理活動 |

### 5 分鐘體驗流程

1. **註冊/登入** (1 分鐘)
   - 訪問 http://localhost:3000
   - 點擊「登入」
   - 使用 `alice` / `password123`

2. **瀏覽活動** (1 分鐘)
   - 點擊導覽列的「活動列表」
   - 搜尋「五月天」
   - 點擊任一活動查看詳情

3. **查看我的票券** (1 分鐘)
   - 點擊「我的票券」
   - 查看擁有的票券
   - 查看交易記錄

4. **查看數據分析** (1 分鐘)
   - 點擊「數據分析」
   - 切換不同分析視圖
   - 觀察熱門活動排行

5. **測試併行控制** (1 分鐘)
   - 開啟無痕視窗
   - 登入為 `bob`
   - 查看交易差異

## 🔧 常見問題速查

### 資料庫連線失敗

```bash
# 檢查 PostgreSQL 是否運行
pg_isready

# 如果未運行，啟動它
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux
```

### Session 錯誤

檢查 `.env.local` 是否存在且包含 `SESSION_SECRET`。

### Port 3000 被佔用

```bash
# 修改 port
npm run dev -- -p 3001
```

## 📚 下一步

- 閱讀 [README.md](./README.md) 了解完整功能
- 閱讀 [DEMO.md](./DEMO.md) 學習如何展示併行控制
- 探索 `/app/api` 目錄查看所有 API 端點
- 查看 `schema.sql` 理解資料庫結構

## 🆘 需要幫助？

1. 檢查終端的錯誤訊息
2. 確認所有服務都在運行
3. 查看 README.md 的「常見問題」章節
4. 檢查資料庫連線設定

## ✅ 驗證安裝

運行以下命令確認一切正常：

```bash
# 檢查 API 是否正常
curl http://localhost:3000/api/events

# 應該看到 JSON 格式的活動列表
```

---

**預計時間**：首次設置約 5-10 分鐘（包含下載依賴）

**重要**：確保 PostgreSQL 和 MongoDB 都在運行中！

