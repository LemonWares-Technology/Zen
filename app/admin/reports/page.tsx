"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  CreditCard,
} from "lucide-react";

interface ReportData {
  period: {
    start: string;
    end: string;
    days: number;
  };
  summary: {
    totalBookings: number;
    totalRevenue: number;
    totalTransactions: number;
    totalUsers: number;
    averageBookingValue: number;
  };
  breakdown: {
    bookingTypes: Array<{
      type: string;
      count: number;
      revenue: number;
      percentage: number;
    }>;
    paymentMethods: Array<{
      method: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
  };
  topDestinations: Array<{
    code: string;
    count: number;
  }>;
  recentBookings: Array<{
    id: string;
    bookingNumber: string;
    type: string;
    status: string;
    amount: number;
    currency: string;
    customer: string;
    email: string;
    createdAt: string;
  }>;
  newUsers: Array<{
    id: string;
    email: string;
    name: string;
    bookings: number;
    payments: number;
    createdAt: string;
  }>;
}

interface FinancialReportData {
  period: {
    start: string;
    end: string;
  };
  financial: {
    totalRevenue: number;
    totalRefunds: number;
    netRevenue: number;
    transactionCount: number;
    refundCount: number;
  };
  dailyRevenue: Array<{
    date: string;
    amount: number;
    transactions: number;
  }>;
  revenueByType: Array<{
    type: string;
    amount: number;
    bookings: number;
  }>;
  paymentStatus: {
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
  };
}

interface UserReportData {
  period: {
    start: string;
    end: string;
  };
  users: {
    totalNewUsers: number;
    activeUsers: number;
    averageBookingsPerUser: number;
  };
  segments: Array<{
    role: string;
    count: number;
  }>;
  topUsers: Array<{
    id: string;
    email: string;
    name: string;
    bookings: number;
    payments: number;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    email: string;
    name: string;
    lastLogin: string;
    bookings: number;
    payments: number;
  }>;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<
    "summary" | "financial" | "users"
  >("summary");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState<
    ReportData | FinancialReportData | UserReportData | null
  >(null);

  useEffect(() => {
    generateReport();
  }, [reportType, dateRange]);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        type: reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: "json",
      });

      const response = await fetch(`/api/admin/reports?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReportData(data.data);
      } else {
        setError(data.message || "Failed to generate report");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (key: string, value: string) => {
    setDateRange((prev) => ({ ...prev, [key]: value }));
  };

  const downloadReport = async (format: "csv" | "pdf") => {
    try {
      const params = new URLSearchParams({
        type: reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: format,
      });

      const response = await fetch(`/api/admin/reports?${params}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportType}-report-${dateRange.startDate}-to-${dateRange.endDate}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("Failed to download report");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Red Hat Display, sans-serif" }}
          >
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate comprehensive reports and analytics for your business
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadReport("csv")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => downloadReport("pdf")}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) =>
                setReportType(
                  e.target.value as "summary" | "financial" | "users"
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="summary">Summary Report</option>
              <option value="financial">Financial Report</option>
              <option value="users">User Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                handleDateRangeChange("startDate", e.target.value)
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Report Content */}
      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Summary Report */}
          {reportType === "summary" && (
            <SummaryReportView data={reportData as ReportData} />
          )}

          {/* Financial Report */}
          {reportType === "financial" && (
            <FinancialReportView data={reportData as FinancialReportData} />
          )}

          {/* User Report */}
          {reportType === "users" && (
            <UserReportView data={reportData as UserReportData} />
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Select a report type and date range to generate a report
          </p>
        </div>
      )}
    </div>
  );
}

// Summary Report Component
function SummaryReportView({ data }: { data: ReportData }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <>
      {/* Period Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Report Period
        </h2>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          {formatDate(data.period.start)} - {formatDate(data.period.end)} (
          {data.period.days} days)
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Bookings
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.totalBookings}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.totalTransactions}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.totalUsers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Avg Booking Value
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.summary.averageBookingValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Booking Types
          </h3>
          <div className="space-y-3">
            {data.breakdown.bookingTypes.map((type) => (
              <div
                key={type.type}
                className="flex justify-between items-center"
              >
                <span className="text-sm text-gray-600 capitalize">
                  {type.type.toLowerCase()}
                </span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {type.count} bookings
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(type.revenue)} (
                    {formatPercentage(type.percentage)})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Methods
          </h3>
          <div className="space-y-3">
            {data.breakdown.paymentMethods.map((method) => (
              <div
                key={method.method}
                className="flex justify-between items-center"
              >
                <span className="text-sm text-gray-600 capitalize">
                  {method.method.replace("_", " ")}
                </span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {method.count} transactions
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(method.amount)} (
                    {formatPercentage(method.percentage)})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Destinations */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Destinations
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {data.topDestinations.map((destination, index) => (
            <div key={destination.code} className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                #{index + 1}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {destination.code}
              </div>
              <div className="text-sm text-gray-500">
                {destination.count} bookings
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Bookings
          </h3>
          <div className="space-y-3">
            {data.recentBookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="flex justify-between items-center"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {booking.bookingNumber}
                  </div>
                  <div className="text-xs text-gray-500">
                    {booking.customer} • {formatDate(booking.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(booking.amount)}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {booking.status.toLowerCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            New Users
          </h3>
          <div className="space-y-3">
            {data.newUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.email} • {formatDate(user.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user.bookings} bookings
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.payments} payments
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// Financial Report Component
function FinancialReportView({ data }: { data: FinancialReportData }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <>
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.financial.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.financial.netRevenue)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.financial.transactionCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Refunds</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(data.financial.totalRefunds)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Refund Count</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.financial.refundCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Type */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Revenue by Booking Type
        </h3>
        <div className="space-y-3">
          {data.revenueByType.map((type) => (
            <div key={type.type} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 capitalize">
                {type.type.toLowerCase()}
              </span>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(type.amount)}
                </div>
                <div className="text-xs text-gray-500">
                  {type.bookings} bookings
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Status Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.paymentStatus.completed}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {data.paymentStatus.pending}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {data.paymentStatus.failed}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.paymentStatus.refunded}
            </div>
            <div className="text-sm text-gray-600">Refunded</div>
          </div>
        </div>
      </div>
    </>
  );
}

// User Report Component
function UserReportView({ data }: { data: UserReportData }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {/* User Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.users.totalNewUsers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.users.activeUsers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Avg Bookings/User
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.users.averageBookingsPerUser.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Segments */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          User Segments
        </h3>
        <div className="space-y-3">
          {data.segments.map((segment) => (
            <div
              key={segment.role}
              className="flex justify-between items-center"
            >
              <span className="text-sm text-gray-600 capitalize">
                {segment.role.toLowerCase()}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {segment.count} users
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Users and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Users
          </h3>
          <div className="space-y-3">
            {data.topUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user.bookings} bookings
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.payments} payments
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {data.recentActivity.slice(0, 5).map((user) => (
              <div key={user.id} className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last login: {formatDate(user.lastLogin)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user.bookings} bookings
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.payments} payments
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
