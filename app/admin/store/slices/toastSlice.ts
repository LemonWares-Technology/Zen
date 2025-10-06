import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info" | "loading";
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = {
  toasts: [],
};

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<Toast, "id">>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const toast: Toast = {
        id,
        duration: 5000,
        dismissible: true,
        ...action.payload,
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    updateToast: (state, action: PayloadAction<{ id: string; updates: Partial<Toast> }>) => {
      const index = state.toasts.findIndex((toast) => toast.id === action.payload.id);
      if (index !== -1) {
        state.toasts[index] = { ...state.toasts[index], ...action.payload.updates };
      }
    },
  },
});

export const { addToast, removeToast, clearToasts, updateToast } = toastSlice.actions;

// Helper functions for common toast types
export const showSuccess = (title: string, message?: string, options?: Partial<Toast>) =>
  addToast({ type: "success", title, message, ...options });

export const showError = (title: string, message?: string, options?: Partial<Toast>) =>
  addToast({ type: "error", title, message, duration: 7000, ...options });

export const showWarning = (title: string, message?: string, options?: Partial<Toast>) =>
  addToast({ type: "warning", title, message, duration: 6000, ...options });

export const showInfo = (title: string, message?: string, options?: Partial<Toast>) =>
  addToast({ type: "info", title, message, ...options });

export const showLoading = (title: string, message?: string, options?: Partial<Toast>) =>
  addToast({ type: "loading", title, message, duration: 0, dismissible: false, ...options });

export default toastSlice.reducer;
