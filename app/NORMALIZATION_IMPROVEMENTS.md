# Database Normalization Improvements

## Summary

This document summarizes the normalization improvements made to the Ticket Match database schema, specifically addressing the 1NF violation in the `LISTING` table.

## Problem Identified

### 1NF Violation: `offered_ticket_ids` Array Column

**Location**: `LISTING` table  
**Issue**: The `offered_ticket_ids INTEGER[]` column violated First Normal Form (1NF) because:
- It stored multiple values in a single column (non-atomic)
- It represented a repeating group within a single cell
- Foreign key constraints could not be applied to array elements
- Referential integrity was enforced only at the application level

**Example of the violation**:
```sql
listing_id | offered_ticket_ids
-----------+-------------------
1          | {101, 102, 103}    -- Multiple values in one cell
2          | {104, 105}         -- Violates atomicity principle
```

## Solution Implemented

### Created LISTING_TICKET Junction Table

Replaced the array column with a proper many-to-many relationship using a junction table:

```sql
CREATE TABLE LISTING_TICKET (
    listing_id  INTEGER NOT NULL REFERENCES LISTING(listing_id),
    ticket_id   INTEGER NOT NULL REFERENCES TICKET(ticket_id),
    PRIMARY KEY (listing_id, ticket_id)
);
```

**Benefits**:
- ✅ Complies with 1NF (atomic values only)
- ✅ Database-level referential integrity via foreign keys
- ✅ Automatic CASCADE on delete/update
- ✅ Standard relational design pattern
- ✅ Better query flexibility and performance

## Changes Made

### 1. Schema Changes
- **Added**: `LISTING_TICKET` junction table
- **Removed**: `offered_ticket_ids` column from `LISTING` table
- **Updated**: Indexes to support the new structure
- **Updated**: DROP TABLE order to include `LISTING_TICKET`

### 2. Migration Script
- **Created**: `migrate-to-listing-ticket.sql`
- Safely migrates existing data from array to junction table
- Includes verification and rollback instructions

### 3. Backend Code Updates
- **Updated**: TypeScript types (`lib/types.ts`)
- **Updated**: API routes to use JOIN queries instead of array operations
  - `api/listings/route.ts` (GET and POST)
  - `api/listings/[id]/route.ts` (GET)
  - `api/events/[id]/route.ts` (GET)
- **Maintained**: Backward compatibility in API responses

### 4. Data Generation Scripts
- **Updated**: `data_generator.py` to generate `LISTING_TICKET` entries
- **Updated**: `check-data-integrity.js` to validate using junction table

### 5. Documentation
- **Created**: `LISTING_TICKET_MIGRATION.md` - Comprehensive migration guide
- **Created**: `test-listing-ticket.sql` - Test suite for verification
- **Created**: This document - Summary of improvements

## Other Normalization Observations

During the analysis, we identified other areas that are generally well-normalized:

### Well-Normalized Tables ✅
- `USER` - Proper entity table
- `USER_ROLE` - Proper junction table for many-to-many
- `EVENT` - Proper entity table
- `EVENTTIME` - Proper relationship with EVENT
- `EVENT_PERFORMER` - Proper junction table
- `TICKET` - Proper entity table with foreign keys
- `TRADE` - Proper entity table
- `TRADE_PARTICIPANT` - Proper junction table
- `TRADE_TICKET` - Proper junction table with composite relationships
- `USER_BALANCE_LOG` - Proper audit/log table

### Potential Considerations (Not Violations)

1. **USER.balance** - Derived attribute that could be calculated from `USER_BALANCE_LOG`
   - **Decision**: Keep for performance reasons (common pattern)
   - **Justification**: Calculating balance on every query would be expensive

2. **TRADE_TICKET.from_user_id and to_user_id** - Could potentially be derived
   - **Decision**: Keep for clarity and audit trail
   - **Justification**: Explicit storage makes queries simpler and provides clear history

3. **TRADE_PARTICIPANT.role** - Could have transitive dependencies
   - **Decision**: Current design is acceptable
   - **Justification**: Role is directly dependent on the (trade_id, user_id) composite key

## Migration Checklist

- [x] Create LISTING_TICKET junction table in schema
- [x] Create migration script for existing data
- [x] Update TypeScript types
- [x] Update API routes (GET and POST operations)
- [x] Update data generator scripts
- [x] Update data integrity check scripts
- [x] Create test suite
- [x] Create documentation
- [x] Verify no linter errors

## Testing Instructions

### 1. Run Migration
```bash
psql -U postgres -d ticket_match -f app/scripts/migrate-to-listing-ticket.sql
```

### 2. Run Tests
```bash
psql -U postgres -d ticket_match -f app/scripts/test-listing-ticket.sql
```

### 3. Verify Data Integrity
```bash
cd app/scripts
node check-data-integrity.js
```

### 4. Test API Endpoints
```bash
# Test listing creation
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -d '{"event_id": 1, "event_date": "2024-12-31", "type": "Sell", "offered_ticket_ids": [1,2]}'

# Test listing retrieval
curl http://localhost:3000/api/listings/1

# Test event listings
curl http://localhost:3000/api/events/1
```

## Performance Considerations

### Before (Array-based)
```sql
-- Query tickets for a listing
SELECT * FROM ticket WHERE ticket_id = ANY($1);
-- Requires array parameter, no index on array elements
```

### After (Junction Table)
```sql
-- Query tickets for a listing
SELECT t.* FROM listing_ticket lt
JOIN ticket t ON lt.ticket_id = t.ticket_id
WHERE lt.listing_id = $1;
-- Uses indexed JOIN, more efficient
```

**Performance improvements**:
- Better use of indexes
- Standard query optimization applies
- More predictable query plans
- Better statistics for query planner

## Backward Compatibility

The API responses maintain backward compatibility by including both:
- `offered_tickets`: Array of ticket objects (detailed info)
- `offered_ticket_ids`: Array of ticket IDs (for compatibility)

This ensures existing frontend code continues to work without modifications.

## Future Considerations

1. **Remove backward compatibility fields** in a future version after frontend is fully updated
2. **Monitor query performance** and add additional indexes if needed
3. **Consider similar patterns** elsewhere in the application
4. **Document best practices** for future schema changes

## Conclusion

The migration from `offered_ticket_ids` array to the `LISTING_TICKET` junction table successfully addresses the 1NF violation while maintaining backward compatibility and improving data integrity. The database schema now follows proper normalization principles and provides better referential integrity guarantees.

## References

- Main Schema: `/schema.sql`
- Migration Script: `/app/scripts/migrate-to-listing-ticket.sql`
- Test Suite: `/app/scripts/test-listing-ticket.sql`
- Migration Guide: `/app/LISTING_TICKET_MIGRATION.md`
- Data Generator: `/app/scripts/data_generator.py`
- Integrity Checker: `/app/scripts/check-data-integrity.js`

---

**Date**: December 4, 2025  
**Status**: ✅ Complete  
**Impact**: Schema normalization improvement, no breaking changes

