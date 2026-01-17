# React Query Usage Guide

## Overview

React Query (@tanstack/react-query) has been added to the application for improved data caching and synchronization. This provides automatic background refetching, caching, and optimistic updates.

## Configuration

The QueryProvider is configured in `src/context/QueryProvider.tsx` with the following defaults:

- **Stale Time**: 5 minutes - Data is considered fresh for 5 minutes
- **GC Time**: 10 minutes - Unused data is kept in cache for 10 minutes
- **Retry**: 1 - Failed requests are retried once
- **Refetch on Window Focus**: Disabled (we use Supabase realtime subscriptions)
- **Refetch on Mount**: Disabled if data is fresh
- **Refetch on Reconnect**: Enabled

## How to Use

### Basic Query Example

```typescript
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/services/clientService';

function MyComponent() {
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading clients</div>;

  return <div>{/* Render clients */}</div>;
}
```

### Mutation Example

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '@/services/clientService';

function MyComponent() {
  const queryClient = useQueryClient();

  const createClientMutation = useMutation({
    mutationFn: (newClient) => clientService.create(newClient),
    onSuccess: () => {
      // Invalidate and refetch clients query
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const handleCreate = () => {
    createClientMutation.mutate({ name: 'New Client' });
  };

  return <button onClick={handleCreate}>Create Client</button>;
}
```

### Query Keys Best Practices

Use consistent query keys across the application:

```typescript
// Good - Hierarchical keys
['clients'] // All clients
['clients', clientId] // Specific client
['clients', clientId, 'sessions'] // Client's sessions

// Bad - Inconsistent keys
['allClients']
['client-123']
['getClientSessions']
```

## Migration Strategy

### Current State
The app currently uses:
- AppContext with useReducer for state management
- Direct Supabase queries in services
- Supabase realtime subscriptions for live updates

### Recommended Migration Path

**Phase 1: Add React Query alongside existing state** (Current)
- ✅ Install and configure React Query
- ✅ Keep existing AppContext
- Use React Query for read-heavy operations

**Phase 2: Migrate read operations** (Future)
- Convert `loadClients()`, `loadSessions()`, etc. to React Query hooks
- Keep AppContext for UI state (modals, selections, etc.)
- Example:
  ```typescript
  // Before
  const { state } = useApp();
  const clients = state.clients;

  // After
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll(),
  });
  ```

**Phase 3: Optimize mutations** (Future)
- Use React Query mutations for create/update/delete
- Implement optimistic updates
- Keep Supabase realtime for multi-user sync

## Benefits

### Performance
- **Automatic Caching**: Reduces unnecessary API calls
- **Background Refetching**: Keeps data fresh without blocking UI
- **Request Deduplication**: Multiple components requesting same data = 1 API call

### Developer Experience
- **Loading States**: Built-in loading, error, and success states
- **Devtools**: React Query Devtools for debugging (add in development)
- **TypeScript Support**: Full type safety

### User Experience
- **Faster Navigation**: Cached data loads instantly
- **Optimistic Updates**: UI updates before server confirms
- **Automatic Retry**: Failed requests retry automatically

## Adding React Query Devtools (Development Only)

```typescript
// src/app/layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function RootLayout({ children }) {
  return (
    <QueryProvider>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryProvider>
  );
}
```

## Common Patterns

### Dependent Queries
```typescript
const { data: client } = useQuery({
  queryKey: ['clients', clientId],
  queryFn: () => clientService.getById(clientId),
});

const { data: sessions } = useQuery({
  queryKey: ['clients', clientId, 'sessions'],
  queryFn: () => sessionService.getByClientId(clientId),
  enabled: !!client, // Only run if client exists
});
```

### Infinite Queries (Pagination)
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['sessions'],
  queryFn: ({ pageParam = 0 }) => sessionService.getPage(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

## Resources

- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [React Query Examples](https://tanstack.com/query/latest/docs/react/examples/react/basic)
- [Migration Guide](https://tanstack.com/query/latest/docs/react/guides/migrating-to-react-query-4)

