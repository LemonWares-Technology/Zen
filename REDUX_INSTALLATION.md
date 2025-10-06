# Redux Dependencies Installation

## Required Packages

To use the Redux state management in the Zen admin dashboard, you need to install the following packages:

### Core Redux Packages

```bash
npm install @reduxjs/toolkit react-redux redux-persist
```

### TypeScript Types (Development)

```bash
npm install --save-dev @types/redux-persist
```

## Installation Commands

### Option 1: Manual Installation

```bash
cd Zen
npm install @reduxjs/toolkit react-redux redux-persist
npm install --save-dev @types/redux-persist
```

### Option 2: Using the Installation Script

```bash
cd Zen
chmod +x install-redux.sh
./install-redux.sh
```

## Package Descriptions

### @reduxjs/toolkit

- **Purpose**: Modern Redux with best practices and simplified setup
- **Features**:
  - `createSlice` for reducers
  - `createAsyncThunk` for async actions
  - Built-in Immer for immutable updates
  - DevTools integration

### react-redux

- **Purpose**: Official React bindings for Redux
- **Features**:
  - `useSelector` and `useDispatch` hooks
  - Provider component for store access
  - Optimized re-rendering

### redux-persist

- **Purpose**: Persist Redux state across browser sessions
- **Features**:
  - Automatic state serialization/deserialization
  - Configurable persistence (whitelist/blacklist)
  - Hydration on app startup
  - Multiple storage engines (localStorage, sessionStorage, etc.)

### @types/redux-persist

- **Purpose**: TypeScript definitions for redux-persist
- **Features**: Full type safety for persistence operations

## Verification

After installation, verify the setup by:

1. **Start the development server**:

   ```bash
   npm run dev
   ```

2. **Navigate to the admin dashboard**:

   ```text
   http://localhost:3000/admin
   ```

3. **Check the Redux Test Component**:

   - You should see a "Redux State Test" component on the dashboard
   - Test the sidebar toggle and collapse buttons
   - Verify state persistence by refreshing the page

4. **Install Redux DevTools** (Optional):
   - Install the Redux DevTools browser extension
   - Open browser DevTools → Redux tab
   - See all Redux actions and state changes

## Troubleshooting

### Common Installation Issues

1. **Package not found**: Ensure you're in the correct directory (Zen/)
2. **Permission errors**: Use `sudo` on Linux/Mac if needed
3. **Version conflicts**: Clear node_modules and reinstall:

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Runtime Issues

1. **Redux not working**: Check browser console for errors
2. **State not persisting**: Verify localStorage is available
3. **Type errors**: Ensure TypeScript types are installed

## Next Steps

After successful installation:

1. **Remove the test component** from the dashboard in production
2. **Configure Redux DevTools** for development debugging
3. **Customize persistence** settings if needed
4. **Add new slices** for additional state management

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all packages are installed correctly
3. Ensure the Redux provider is wrapping your components
4. Check the Redux DevTools for state inspection
