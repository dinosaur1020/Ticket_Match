# Admin Quick Reference Guide

## 🔑 Admin Login Credentials

Test operator accounts (password: `password123`):
- Username: `operator` / Email: `operator@example.com`
- Username: `admin` / Email: `admin@example.com`

---

## 🚀 Quick Access

### Admin Panel
**URL:** `http://localhost:3000/admin`

### Analytics Dashboard
**URL:** `http://localhost:3000/analytics`

---

## 📋 Admin Functions Overview

### 1. User Management 👥

**Tab:** User Management (用戶管理)

**Actions:**
- **View Users** - See all users with their status, balance, and activity
- **Suspend User** - Block a user from all operations (Red button)
- **Activate User** - Restore a suspended user (Green button)
- **Set Warning** - Flag a user with warning status (Yellow button)

**User Statuses:**
- 🟢 **Active** - Normal user
- 🔴 **Suspended** - Blocked from all actions
- 🟡 **Warning** - Can use system but flagged

**API:**
```bash
# List all users
GET /api/admin/users

# Update user status
PATCH /api/users/{user_id}/status
Body: { "status": "Active" | "Suspended" | "Warning" }
```

---

### 2. Event Management 🎭

**Tab:** Event Management (活動管理)

**Actions:**
- **Create Event** - Add new events with details
- **Add Performers** - Assign performers to events
- **Add Event Times** - Set event session times

**Form Fields:**
- Event Name* (required)
- Venue* (required)
- Description (optional)
- Performers (add multiple)
- Event Times* (start & end time, add multiple)

**API:**
```bash
# Create event
POST /api/events
Body: { "event_name": "...", "venue": "...", "description": "..." }

# Add performer
POST /api/performers
Body: { "event_id": 1, "performer": "Artist Name" }

# Add event time
POST /api/eventtimes
Body: { "event_id": 1, "start_time": "2024-12-25T19:00", "end_time": "2024-12-25T22:00" }
```

---

### 3. Listing Management 📝

**Tab:** Listing Management (貼文管理)

**View Information:**
- Listing type (Sell/Buy/Exchange)
- Status (Active/Completed/Canceled/Expired)
- Event details
- User info (username, email)
- Content
- Trade count

**Badge Colors:**
- 🟢 **Sell** - Green
- 🔵 **Buy** - Blue
- 🟠 **Exchange** - Orange

**API:**
```bash
# List all listings
GET /api/admin/listings?status=Active&limit=100&offset=0
```

---

### 4. Analytics 📊

**Available Analytics:**

1. **Popular Events** (熱門活動排行)
   - Events ranked by listing count

2. **Ticket Flow** (票券流動分析)
   - Ticket transfer patterns between users

3. **Conversion Rate** (活動轉換率)
   - Listing completion rates by event

4. **Search Keywords** (熱門搜尋關鍵字)
   - Most searched terms

5. **Browsing Trends** (瀏覽趨勢)
   - Daily view statistics
   - Time ranges: 7/30/90 days or all time

6. **Popular Views** (熱門瀏覽內容)
   - Most viewed events and listings

7. **User Browsing** (我的瀏覽記錄)
   - Personal browsing history

---

## 🛡️ Security Features

### Role-Based Access
- **Regular Users:** Can only access their own resources
- **Operators:** Full admin access to all functions

### Automatic Protection
Suspended users are automatically blocked from:
- ❌ Creating listings
- ❌ Creating tickets
- ❌ Creating trades
- ❌ Confirming trades
- ❌ Updating/deleting listings

### Error Responses
- **401** - Not authenticated
- **403** - Forbidden (insufficient permissions or suspended)
- **404** - Resource not found
- **500** - Server error

---

## 🔧 Common Admin Tasks

### Suspend a Problematic User
1. Go to Admin Panel → User Management
2. Find the user in the table
3. Click red "停權" (Suspend) button
4. Confirm the action
5. User is immediately blocked from all operations

### Create a New Event
1. Go to Admin Panel → Event Management
2. Click "建立新活動" (Create New Event)
3. Fill in event details
4. Add performers (click + to add more)
5. Add event times (click + to add more sessions)
6. Click "確認建立" (Confirm Create)

### Monitor System Activity
1. Go to Analytics Dashboard
2. Select desired analytics tab
3. Adjust filters/time ranges as needed
4. Review data and trends

### Check Specific User Activity
1. Go to Admin Panel → User Management
2. Find user in table
3. View statistics: Tickets / Listings / Trades
4. Check user status and balance

---

## 💡 Tips & Best Practices

### User Management
- **Always confirm** before suspending users
- Use **Warning** status for first-time offenders
- Check user's **trade count** before suspending (might affect ongoing trades)
- Review user's **balance** when dealing with disputes

### Event Management
- Add **multiple event times** for events with multiple sessions
- Include **all performers** for better search results
- Use descriptive **venue names** for clarity

### Monitoring
- Regularly check **Popular Events** to identify trending content
- Monitor **Conversion Rate** to identify issues
- Review **Search Keywords** to understand user interests
- Check **Ticket Flow** for unusual patterns

---

## 🐛 Troubleshooting

### Cannot Access Admin Panel
- ✅ Check if logged in as operator/admin
- ✅ Verify user has `Operator` role in database
- ✅ Clear browser cache and cookies

### User Status Not Updating
- ✅ Check network tab for API errors
- ✅ Verify user_id is valid UUID
- ✅ Check browser console for errors

### Events Not Showing
- ✅ Ensure event has at least one event time
- ✅ Check if event was created successfully
- ✅ Refresh the events list

---

## 📞 Support

For technical issues or questions:
1. Check console logs for errors
2. Review `ADMIN_FUNCTIONS_SUMMARY.md` for detailed documentation
3. Verify database connection and data integrity
4. Check API responses in browser network tab

---

## 🎯 Success Checklist

Before deploying to production, verify:
- [x] All admin functions work correctly
- [x] User suspension blocks all operations
- [x] Event creation works with performers and times
- [x] Analytics display correct data
- [x] Non-operators cannot access admin routes
- [x] Error messages are clear and helpful
- [x] UI is responsive and user-friendly

---

**Last Updated:** December 7, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅

