import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
  error: null,
};

// Async thunks
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      // Only run on client-side to avoid hydration issues
      if (typeof window === "undefined") {
        return rejectWithValue("Client-side only");
      }

      const token = localStorage.getItem("admin_token");
      if (!token) {
        // No token found, user needs to login - this is not an error
        return rejectWithValue("No token found");
      }

      // Check for old dev bypass token and clear it
      if (token === "dev_bypass_token") {
        localStorage.removeItem("admin_token");
        return rejectWithValue("No token found");
      }

      // Set the token in the API client
      apiClient.setToken(token);

      const data = await apiClient.get<{ user: User }>(
        "/api/admin/auth/verify-token"
      );
      return { token, user: data.user };
    } catch (error: any) {
      console.error("Auth check error:", error);
      return rejectWithValue(error.message || "Authentication failed");
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      // Only run on client-side to avoid hydration issues
      if (typeof window === "undefined") {
        throw new Error("Client-side only");
      }

      const data = await apiClient.post<{ token: string; user: User }>(
        "/api/admin/auth/login",
        credentials
      );

      if (!data || !data.token) {
        throw new Error("Invalid response format from server");
      }

      apiClient.setToken(data.token);
      return { token: data.token, user: data.user };
    } catch (error: any) {
      console.error("Login error:", error);
      return rejectWithValue(error.message || "Login failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      apiClient.clearToken();
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
        // Ensure token is stored in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_token", action.payload.token);
        }
      })
      .addCase(checkAuth.rejected, (state, action) => {
        console.log("Auth check rejected:", action.payload);
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        // Don't set error for "No token found" or "Client-side only" - these are normal cases
        if (
          action.payload !== "No token found" &&
          action.payload !== "Client-side only"
        ) {
          state.error = action.payload as string;
        } else {
          state.error = null;
        }
        // Clear any invalid token from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("admin_token");
        }
        apiClient.clearToken();
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
        // Store token in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_token", action.payload.token);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, setUser, setToken } = authSlice.actions;
export default authSlice.reducer;
