import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";

// Import slices
import sidebarSlice from "./slices/sidebarSlice";
import authSlice from "./slices/authSlice";
import dashboardSlice from "./slices/dashboardSlice";
import toastSlice from "./slices/toastSlice";

// Persist configuration
const persistConfig = {
  key: "zen-admin-root",
  storage,
  whitelist: ["sidebar", "auth"], // Only persist sidebar and auth state
};

// Root reducer
const rootReducer = combineReducers({
  sidebar: sidebarSlice,
  auth: authSlice,
  dashboard: dashboardSlice,
  toast: toastSlice,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

// Persistor
export const persistor = persistStore(store);

// Type definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
