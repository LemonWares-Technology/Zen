import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

interface DashboardStats {
  totalBookings: number;
  totalUsers: number;
  totalRevenue: number;
  averageBookingValue: number;
}

interface RecentBooking {
  id: string;
  bookingNumber: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  customer: string;
  email: string;
  createdAt: string;
}

interface BookingStat {
  type: string;
  count: number;
  revenue: number;
}

interface TopDestination {
  code: string;
  count: number;
}

interface DashboardState {
  stats: DashboardStats | null;
  recentBookings: RecentBooking[];
  bookingStats: BookingStat[];
  topDestinations: TopDestination[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: DashboardState = {
  stats: null,
  recentBookings: [],
  bookingStats: [],
  topDestinations: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchDashboardData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/admin/dashboard");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !data.data) {
        throw new Error("Invalid response format from server");
      }

      return data.data;
    } catch (error: any) {
      console.error("Dashboard data fetch error:", error);
      return rejectWithValue(error.message || "Failed to fetch dashboard data");
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  "dashboard/fetchAnalytics",
  async (params: { type: string; period?: string }, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams(params);
      const response = await fetch(`/api/admin/analytics?${searchParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch analytics");
      }

      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setStats: (state, action: PayloadAction<DashboardStats>) => {
      state.stats = action.payload;
    },
    addRecentBooking: (state, action: PayloadAction<RecentBooking>) => {
      state.recentBookings.unshift(action.payload);
      if (state.recentBookings.length > 10) {
        state.recentBookings = state.recentBookings.slice(0, 10);
      }
    },
    updateBookingStatus: (
      state,
      action: PayloadAction<{ id: string; status: string }>
    ) => {
      const booking = state.recentBookings.find(
        (b) => b.id === action.payload.id
      );
      if (booking) {
        booking.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard Data
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.overview;
        state.recentBookings = action.payload.recentBookings;
        state.bookingStats = action.payload.bookingStats;
        state.topDestinations = action.payload.topDestinations;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle different analytics types
        if (action.payload.overview) {
          state.stats = action.payload.overview;
        }
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setStats, addRecentBooking, updateBookingStatus } =
  dashboardSlice.actions;
export default dashboardSlice.reducer;
