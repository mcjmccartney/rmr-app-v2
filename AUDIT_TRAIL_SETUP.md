# Audit Trail System Setup

## Overview

The audit trail system provides comprehensive tracking of all important operations in the Raising My Rescue application. It logs creates, updates, and deletes for sessions, clients, and other critical entities.

## Features

- ✅ **Comprehensive Logging**: Tracks all session and client operations (create, update, delete)
- ✅ **Before/After Snapshots**: Stores old and new values for all changes
- ✅ **User Attribution**: Records which user performed each action
- ✅ **Searchable History**: Filter by action type, entity type, date range, and search terms
- ✅ **Detailed View**: Expand any log entry to see full before/after JSON data
- ✅ **Non-Blocking**: Audit logging failures don't break main operations

## Database Setup

### Step 1: Run the Migration

Execute the SQL migration in your Supabase SQL Editor:

```bash
migrations/20251209_add_audit_trail.sql
```

This creates:
- `audit_logs` table with all necessary columns
- Indexes for optimal query performance
- Row Level Security (RLS) policies
- Comments for documentation

### Step 2: Verify the Table

After running the migration, verify the table was created:

```sql
SELECT * FROM audit_logs LIMIT 10;
```

## What Gets Logged

### Session Operations
- **CREATE**: New session created with all details
- **UPDATE**: Session modified (tracks old and new values)
- **DELETE**: Session deleted (preserves final state before deletion)

### Client Operations
- **CREATE**: New client added
- **UPDATE**: Client information modified
- **DELETE**: Client removed (preserves final state)

### Other Operations (Available for Future Use)
- Session plan updates
- Booking terms submissions
- Membership payments
- Calendar syncs
- Email sends
- Data exports

## Using the Audit Trail

### Viewing Audit Logs

Navigate to `/audit-trail` in the application to view the audit trail interface.

**Features:**
- Filter by action type (CREATE, UPDATE, DELETE, etc.)
- Filter by entity type (SESSION, CLIENT, etc.)
- Filter by date range
- Search by description, email, or entity ID
- View statistics (total creates, updates, deletes)
- Expand individual logs to see full JSON data

### Programmatic Access

```typescript
import { auditService } from '@/services/auditService';

// Get all logs
const logs = await auditService.getLogs();

// Get logs with filters
const sessionLogs = await auditService.getLogs({
  entity_type: 'SESSION',
  action_type: 'DELETE',
  start_date: '2025-01-01',
  limit: 50
});

// Get history for a specific entity
const history = await auditService.getEntityHistory('SESSION', sessionId);

// Get recent logs
const recent = await auditService.getRecentLogs(100);
```

### Manual Logging

```typescript
import { auditService } from '@/services/auditService';

// Log a custom event
await auditService.log({
  action_type: 'UPDATE',
  entity_type: 'SESSION',
  entity_id: session.id,
  user_email: user.email,
  old_values: { status: 'pending' },
  new_values: { status: 'confirmed' },
  description: 'Session status updated',
  metadata: { reason: 'Payment received' }
});
```

## Automatic Logging

The following operations are automatically logged:

### In AppContext.tsx
- `createSession()` - Logs session creation
- `updateSession()` - Logs session updates with before/after values
- `deleteSession()` - Logs session deletion with final state
- `createClient()` - Logs client creation
- `updateClient()` - Logs client updates with before/after values
- `deleteClient()` - Logs client deletion with final state

## Data Structure

Each audit log entry contains:

```typescript
{
  id: string;                    // Unique log ID
  action_type: string;           // CREATE, UPDATE, DELETE, etc.
  entity_type: string;           // SESSION, CLIENT, etc.
  entity_id?: string;            // ID of affected entity
  user_email?: string;           // Email of user who performed action
  user_id?: string;              // User ID if available
  timestamp: string;             // When the action occurred
  old_values?: object;           // Previous state (for UPDATE/DELETE)
  new_values?: object;           // New state (for CREATE/UPDATE)
  description?: string;          // Human-readable description
  metadata?: object;             // Additional context
  created_at: string;            // When log was created
}
```

## Security

- **Row Level Security (RLS)**: Enabled on audit_logs table
- **Read Access**: Authenticated users can read audit logs
- **Write Access**: Only service role can insert logs (prevents tampering)
- **No Updates/Deletes**: Audit logs are append-only (immutable)

## Performance

- Indexed on: timestamp, action_type, entity_type, entity_id, user_email
- Combined index for entity history queries
- Default limit of 100 logs per query (configurable)
- Non-blocking: Audit failures don't affect main operations

## Troubleshooting

### Logs Not Appearing

1. Check that the migration was run successfully
2. Verify RLS policies are in place
3. Check browser console for errors
4. Verify user is authenticated

### Performance Issues

1. Use date range filters to limit results
2. Increase indexes if needed
3. Consider archiving old logs (future feature)

## Future Enhancements

- [ ] Export audit logs to CSV
- [ ] Archive old logs automatically
- [ ] Email notifications for critical actions
- [ ] Restore from audit log (undo functionality)
- [ ] Advanced analytics and reporting

