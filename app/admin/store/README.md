# Redux State Management

This document describes the Redux state management implementation for the Zen admin dashboard.

## Overview

The admin dashboard uses Redux Toolkit with Redux Persist for state management, providing:

- **Centralized State**: All application state in a single store
- **Persistence**: Automatic state persistence across browser sessions
- **Type Safety**: Full TypeScript support with typed hooks
- **DevTools**: Redux DevTools integration for debugging
- **Performance**: Optimized re-renders and state updates

## Store Structure

```text
store/
├── store.ts              # Main store configuration
├── index.ts              # Export file for all store-related items
├── hooks.ts              # Typed Redux hooks
├── ReduxProvider.tsx     # Redux provider with persistence
├── ReduxDevTools.tsx     # Development tools wrapper
└── slices/
    ├── sidebarSlice.ts   # Sidebar state management
    ├── authSlice.ts      # Authentication state management
    └── dashboardSlice.ts # Dashboard data management
```

## State Slices

### Sidebar Slice (`sidebarSlice.ts`)

Manages sidebar visibility and collapse state.

**State:**

```typescript
interface SidebarState {
  isOpen: boolean; // Mobile sidebar visibility
  isCollapsed: boolean; // Desktop sidebar collapse state
}
```

**Actions:**

- `toggleSidebar()` - Toggle mobile sidebar
- `closeSidebar()` - Close mobile sidebar
- `openSidebar()` - Open mobile sidebar
- `collapseSidebar()` - Toggle desktop collapse
- `setCollapsed(boolean)` - Set collapse state
- `setOpen(boolean)` - Set open state

**Usage:**

```typescript
const dispatch = useAppDispatch();
const { isOpen, isCollapsed } = useAppSelector((state) => state.sidebar);

// Toggle sidebar
dispatch(toggleSidebar());

// Set collapsed state
dispatch(setCollapsed(true));
```

### Auth Slice (`authSlice.ts`)

Manages authentication state and user data.

**State:**

```typescript
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
}
```

**Actions:**

- `checkAuth()` - Async: Verify current token
- `login(credentials)` - Async: Login with email/password
- `logout()` - Clear auth state and token
- `clearError()` - Clear error message
- `setUser(user)` - Set user data
- `setToken(token)` - Set auth token

**Usage:**

```typescript
const dispatch = useAppDispatch();
const { isAuthenticated, isLoading, user, error } = useAppSelector(
  (state) => state.auth
);

// Login
dispatch(login({ email: "admin@zen.com", password: "password" }));

// Check auth on app load
dispatch(checkAuth());

// Logout
dispatch(logout());
```

### Dashboard Slice (`dashboardSlice.ts`)

Manages dashboard data and analytics.

**State:**

```typescript
interface DashboardState {
  stats: DashboardStats | null;
  recentBookings: RecentBooking[];
  bookingStats: BookingStat[];
  topDestinations: TopDestination[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}
```

**Actions:**

- `fetchDashboardData()` - Async: Fetch dashboard overview
- `fetchAnalytics(params)` - Async: Fetch analytics data
- `clearError()` - Clear error message
- `setStats(stats)` - Set dashboard statistics
- `addRecentBooking(booking)` - Add new booking to recent list
- `updateBookingStatus({id, status})` - Update booking status

**Usage:**

```typescript
const dispatch = useAppDispatch();
const { stats, recentBookings, isLoading } = useAppSelector(
  (state) => state.dashboard
);

// Fetch dashboard data
dispatch(fetchDashboardData());

// Fetch analytics
dispatch(fetchAnalytics({ type: "summary", period: "30" }));
```

## Persistence

Redux Persist automatically saves and restores state:

**Persisted State:**

- `sidebar` - Sidebar collapse state
- `auth` - Authentication token and user data

**Not Persisted:**

- `dashboard` - Fresh data on each session

**Configuration:**

```typescript
const persistConfig = {
  key: "zen-admin-root",
  storage,
  whitelist: ["sidebar", "auth"],
};
```

## Typed Hooks

Use these hooks instead of plain Redux hooks:

```typescript
import { useAppDispatch, useAppSelector } from "../store/hooks";

function MyComponent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Component logic
}
```

## Async Actions

All API calls are handled through Redux async thunks:

```typescript
// Example: Login async thunk
export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("admin_token", data.token);
      return { token: data.token, user: data.user };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
```

## Error Handling

Errors are handled consistently across all slices:

```typescript
// In component
const { error } = useAppSelector((state) => state.auth);

// Clear error
dispatch(clearError());

// Display error
{
  error && (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <p className="text-red-800">{error}</p>
    </div>
  );
}
```

## Loading States

Loading states are managed automatically:

```typescript
// In component
const { isLoading } = useAppSelector((state) => state.dashboard);

// Show loading spinner
{
  isLoading && (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
  );
}
```

## Best Practices

### 1. Use Typed Hooks

```typescript
// ✅ Good
const dispatch = useAppDispatch();
const state = useAppSelector((state) => state.sidebar);

// ❌ Avoid
const dispatch = useDispatch();
const state = useSelector((state) => state.sidebar);
```

### 2. Handle Async Actions Properly

```typescript
// ✅ Good - Handle all states
useEffect(() => {
  dispatch(fetchDashboardData());
}, [dispatch]);

const { data, isLoading, error } = useAppSelector((state) => state.dashboard);
```

### 3. Clear Errors Appropriately

```typescript
// ✅ Good - Clear errors on component unmount
useEffect(() => {
  return () => {
    dispatch(clearError());
  };
}, [dispatch]);
```

### 4. Use Proper Action Types

```typescript
// ✅ Good - Use action creators
dispatch(toggleSidebar());

// ❌ Avoid - Direct state mutation
state.sidebar.isOpen = !state.sidebar.isOpen;
```

## Development Tools

### Redux DevTools

- **Install**: Redux DevTools browser extension
- **Access**: Open browser DevTools → Redux tab
- **Features**: Time travel debugging, action inspection, state diff

### Debugging

```typescript
// Log state changes
console.log("Current state:", store.getState());

// Dispatch test actions
dispatch(toggleSidebar());
```

## Migration from Context

The Redux implementation replaces the previous context-based state management:

**Before (Context):**

```typescript
const { isOpen, toggleSidebar } = useSidebar();
```

**After (Redux):**

```typescript
const dispatch = useAppDispatch();
const { isOpen } = useAppSelector((state) => state.sidebar);
dispatch(toggleSidebar());
```

## Performance Considerations

1. **Selective Subscriptions**: Components only re-render when their selected state changes
2. **Memoization**: Use `useMemo` and `useCallback` for expensive computations
3. **Persistence**: Only persist necessary state to avoid performance issues
4. **Async Actions**: Proper loading states prevent UI blocking

## Testing

```typescript
// Test Redux actions
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "../store";

const renderWithRedux = (component: React.ReactElement) => {
  return render(<Provider store={store}>{component}</Provider>);
};
```

## Troubleshooting

### Common Issues

1. **State not persisting**: Check persist configuration and storage
2. **Actions not dispatching**: Verify Redux provider is wrapping components
3. **Type errors**: Ensure proper TypeScript types are imported
4. **Performance issues**: Check for unnecessary re-renders with DevTools

### Debug Commands

```typescript
// Check current state
console.log(store.getState());

// Check persisted state
console.log(localStorage.getItem("persist:zen-admin-root"));

// Clear persisted state
localStorage.removeItem("persist:zen-admin-root");
```
