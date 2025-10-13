# Admin Dashboard Components

This directory contains the separated components for the Zen admin dashboard, organized for better maintainability and reusability.

## Component Structure

```
components/
├── index.ts                 # Export file for all components
├── SidebarContext.tsx       # Sidebar state management context
├── Sidebar.tsx              # Main sidebar component
├── TopNavigation.tsx        # Top navigation bar component
├── AdminLayout.tsx          # Main layout wrapper component
├── LoadingSpinner.tsx       # Loading spinner component
├── SkeletonLoader.tsx       # Skeleton loading component
├── ToastContainer.tsx       # Toast notifications container
├── ErrorBoundary.tsx        # Error boundary component
└── ClientOnly.tsx           # Client-side only wrapper
```

## Components

### Context Providers

#### `SidebarContext.tsx`

- **Purpose**: Manages sidebar state (open/closed, collapsed/expanded)
- **Exports**: `SidebarProvider`, `useSidebar`
- **State**:
  - `isOpen`: Mobile sidebar visibility
  - `isCollapsed`: Desktop sidebar collapse state
  - `toggleSidebar()`: Toggle mobile sidebar
  - `collapseSidebar()`: Toggle desktop sidebar collapse

### UI Components

#### `Sidebar.tsx`

- **Purpose**: Main navigation sidebar
- **Features**:
  - Responsive design (mobile overlay, desktop fixed)
  - Collapsible on desktop
  - Active route highlighting
  - Tooltip support when collapsed
  - Smooth animations and transitions

#### `TopNavigation.tsx`

- **Purpose**: Top navigation bar
- **Features**:
  - Mobile sidebar toggle button
  - Global search functionality
  - Notifications indicator
  - User menu with logout
  - Responsive design

#### `AdminLayout.tsx`

- **Purpose**: Main layout wrapper
- **Features**:
  - Combines all layout components
  - Handles authentication loading states
  - Responsive content area with sidebar offset
  - Smooth transitions for sidebar state changes

## Usage

### Basic Setup

```tsx
import { SidebarProvider } from "./components";
import AdminLayout from "./components/AdminLayout";

export default function AdminRootLayout({ children }) {
  return (
    <SidebarProvider>
      <AdminLayout>{children}</AdminLayout>
    </SidebarProvider>
  );
}
```

### Using Context Hooks

```tsx
import { useSidebar } from "./components";

function MyComponent() {
  const { isCollapsed, toggleSidebar } = useSidebar();

  // Component logic
}
```

## Design System

### Colors

- **Primary Orange**: `#FF6B35` - Used for active states and accents
- **Primary Blue**: `#2563EB` - Used for secondary actions and highlights
- **Gray Scale**: Various shades for text, borders, and backgrounds

### Typography

- **Font Family**: Red Hat Display (loaded from Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800, 900

### Animations

- **Sidebar Transitions**: 300ms ease-in-out
- **Hover Effects**: 200ms ease
- **Loading Spinners**: Continuous rotation

## Responsive Behavior

### Mobile (< 1024px)

- Sidebar becomes overlay with backdrop
- Toggle button in top navigation
- Auto-close on navigation
- Touch-friendly interface

### Desktop (≥ 1024px)

- Fixed sidebar with collapse functionality
- Collapse button in sidebar header
- Tooltip support when collapsed
- Smooth content area transitions

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG compliant color combinations

## Performance

- **Lazy Loading**: Components load only when needed
- **Optimized Animations**: CSS transforms for smooth performance
- **Minimal Re-renders**: Context optimization to prevent unnecessary updates
- **Bundle Size**: Tree-shakeable exports

## Customization

### Adding New Navigation Items

```tsx
// In Sidebar.tsx
const navigation = [
  // ... existing items
  { name: "New Page", href: "/admin/new-page", icon: NewIcon },
];
```

### Customizing Colors

```css
/* In globals.css */
:root {
  --zen-orange: #ff6b35;
  --zen-blue: #2563eb;
  /* Custom colors */
  --zen-primary: #your-color;
}
```

### Adding New Context State

```tsx
// Create new context file
export function NewContextProvider({ children }) {
  const [state, setState] = useState(initialState);

  return (
    <NewContext.Provider value={{ state, setState }}>
      {children}
    </NewContext.Provider>
  );
}
```

## Best Practices

1. **Context Usage**: Only use contexts for truly global state
2. **Component Size**: Keep components focused and single-purpose
3. **Performance**: Use React.memo for expensive components
4. **Accessibility**: Always include proper ARIA attributes
5. **Testing**: Write tests for context providers and components
6. **Documentation**: Keep this README updated with changes

## Dependencies

- **React**: 18+ with hooks
- **Next.js**: 14+ for routing and navigation
- **Lucide React**: For icons
- **Tailwind CSS**: For styling
- **TypeScript**: For type safety
