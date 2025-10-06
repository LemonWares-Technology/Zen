# Redux Integration Guide

This guide explains how to use Redux state management in the Zen admin dashboard.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd Zen
npm install @reduxjs/toolkit react-redux redux-persist
npm install --save-dev @types/redux-persist
```

### 2. Verify Installation

Start the development server and navigate to `/admin`. You should see a "Redux State Test" component on the dashboard that shows the current state.

## 📊 State Management

### Available State Slices

#### Sidebar State

```typescript
const { isOpen, isCollapsed } = useAppSelector((state) => state.sidebar);
const dispatch = useAppDispatch();

// Toggle mobile sidebar
dispatch(toggleSidebar());

// Toggle desktop collapse
dispatch(collapseSidebar());
```

#### Authentication State

```typescript
const { isAuthenticated, isLoading, user, error } = useAppSelector(
  (state) => state.auth
);
const dispatch = useAppDispatch();

// Login
dispatch(login({ email: "admin@zen.com", password: "password" }));

// Logout
dispatch(logout());

// Check authentication
dispatch(checkAuth());
```

#### Dashboard State

```typescript
const { stats, recentBookings, isLoading } = useAppSelector(
  (state) => state.dashboard
);
const dispatch = useAppDispatch();

// Fetch dashboard data
dispatch(fetchDashboardData());

// Fetch analytics
dispatch(fetchAnalytics({ type: "summary", period: "30" }));
```

## 🔧 Usage Examples

### In Components

```typescript
"use client";

import { useAppSelector, useAppDispatch } from "../store/hooks";
import { toggleSidebar } from "../store/slices/sidebarSlice";

export default function MyComponent() {
  const dispatch = useAppDispatch();
  const { isOpen } = useAppSelector((state) => state.sidebar);

  const handleToggle = () => {
    dispatch(toggleSidebar());
  };

  return (
    <button onClick={handleToggle}>{isOpen ? "Close" : "Open"} Sidebar</button>
  );
}
```

### Async Actions

```typescript
// Login with error handling
const handleLogin = async (credentials) => {
  try {
    await dispatch(login(credentials)).unwrap();
    // Login successful
  } catch (error) {
    // Handle error
    console.error("Login failed:", error);
  }
};
```

## 🎯 Key Features

### State Persistence

- **Sidebar State**: Remembers collapse/expand state across sessions
- **Auth State**: Persists login token and user data
- **Dashboard State**: Fresh data on each session (not persisted)

### Type Safety

- Full TypeScript support with typed hooks
- Type-safe actions and state selectors
- Compile-time error checking

### Performance

- Selective re-renders (components only update when their state changes)
- Optimized state updates with Redux Toolkit
- Minimal bundle size impact

### Developer Experience

- Redux DevTools integration
- Time travel debugging
- Action inspection and state diff
- Hot reloading support

## 🛠️ Development Tools

### Redux DevTools

1. Install the Redux DevTools browser extension
2. Open browser DevTools → Redux tab
3. Inspect actions, state changes, and time travel

### Debugging

```typescript
// Log current state
console.log("Current state:", store.getState());

// Monitor state changes
store.subscribe(() => {
  console.log("State changed:", store.getState());
});
```

## 📱 Mobile Considerations

The Redux state management works seamlessly across all devices:

- **Mobile**: Sidebar state persists across app sessions
- **Desktop**: Collapse state remembered between visits
- **Tablet**: Adaptive behavior based on screen size

## 🔒 Security

- **Token Management**: Secure token storage with automatic cleanup
- **State Isolation**: Each slice manages its own state independently
- **Error Handling**: Consistent error handling across all async actions

## 🚀 Production Deployment

### Build Optimization

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

```env
# Redux DevTools (disabled in production)
NODE_ENV=production
```

## 📚 Additional Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React-Redux Hooks](https://react-redux.js.org/api/hooks)
- [Redux Persist](https://github.com/rt2zz/redux-persist)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

## 🐛 Troubleshooting

### Common Issues

1. **State not updating**: Check if Redux provider is wrapping components
2. **Persistence not working**: Verify localStorage is available
3. **Type errors**: Ensure proper TypeScript types are imported
4. **Performance issues**: Use Redux DevTools to identify unnecessary re-renders

### Debug Commands

```typescript
// Check persisted state
console.log(localStorage.getItem("persist:zen-admin-root"));

// Clear persisted state
localStorage.removeItem("persist:zen-admin-root");

// Reset entire store
dispatch({ type: "RESET_STORE" });
```

## 🎉 Benefits Over Context

### Performance

- **Selective Updates**: Only components using changed state re-render
- **Optimized Rendering**: Redux Toolkit's optimized reducers
- **Memory Efficiency**: Better memory management for large state

### Developer Experience

- **Time Travel Debugging**: Step through state changes
- **Action Inspection**: See exactly what actions were dispatched
- **State Diff**: Visual comparison of state changes
- **Hot Reloading**: State persists during development

### Scalability

- **Predictable State**: Clear state update patterns
- **Middleware Support**: Easy to add logging, analytics, etc.
- **Testing**: Easier to test state logic in isolation
- **Team Collaboration**: Standardized state management patterns
