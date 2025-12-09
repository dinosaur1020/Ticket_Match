# Setup Verification Checklist ✅

This document verifies that teammates can successfully set up the project.

## What Was Checked

### ✅ Critical Files Present
- `app/ticket_match_data.dump` (1.6 MB) - **Included in repository**
- `app/.env copy.example` - Configuration template
- `app/package.json` - All npm scripts available
- `schema.sql` - Database schema

### ✅ README Updates Made
1. **Updated**: Clarified that `ticket_match_data.dump` is now included in the repository
2. **Updated**: Removed outdated instructions about getting the file from team lead
3. **Updated**: Corrected file size from ~2.3MB to ~1.6MB
4. **Added**: Cross-platform compatibility notes
5. **Added**: Alternative restore commands for different systems

### ✅ Setup Flow Verified

#### For Teammates (Step-by-step):
```bash
# 1. Clone repository
git clone <repository-url>
cd Ticket_Match-1/app

# 2. Install dependencies
npm install

# 3. Copy and configure environment
cp ".env copy.example" .env.local
# Edit .env.local with your database credentials

# 4. Create database
createdb ticket_match

# 5. Initialize schema
npm run init-db

# 6. Import data (dump file is already in app/)
npm run db:restore

# 7. Setup MongoDB indexes
npm run init-mongo-indexes

# 8. Start application
npm run dev
```

### ✅ Test Accounts Available
All test accounts use password: `password123`
- **Operators**: `operator`, `admin`
- **Users**: `alice`, `bob`, `charlie`, `david`, `emma`, `frank`

### ✅ Expected Data After Restore
- 3,000 users
- 300 events
- 10,000 tickets
- 24,000 listings
- 3,000 trades

## Potential Issues & Solutions

### Issue 1: npm run db:restore fails on non-macOS
**Symptom**: Command uses absolute path to Postgres.app
**Solution**: Use system pg_restore instead:
```bash
pg_restore -d ticket_match --clean --if-exists app/ticket_match_data.dump
```

### Issue 2: PostgreSQL password required
**Symptom**: pg_restore asks for password
**Solution**: Either:
- Set PGPASSWORD environment variable
- Use ~/.pgpass file
- Run as postgres superuser

### Issue 3: MongoDB connection fails
**Symptom**: "MongoServerError: connect ECONNREFUSED"
**Solution**:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Docker
docker run --name mongodb-ticket -p 27017:27017 -d mongo:6
```

## What Teammates Need

### Required Software
- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+
- Git

### From This Repository
Everything needed is now included:
- ✅ Source code
- ✅ Database dump file
- ✅ Environment template
- ✅ Setup scripts
- ✅ Documentation

### What They DON'T Need
- ❌ Separate dump file download
- ❌ Manual data generation
- ❌ SQL files from team lead

## Verification Steps for New Team Members

After setup, verify by:
1. Opening http://localhost:3000
2. Logging in with `alice` / `password123`
3. Checking ticket count: Should see tickets in "My Tickets"
4. Checking listings: Should see 24,000+ listings
5. Testing search: Search for "周杰倫" should return results

## Last Updated
December 9, 2025

