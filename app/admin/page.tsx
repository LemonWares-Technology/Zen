"use client";

import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { fetchDashboardData } from "./store/slices/dashboardSlice";
import { showError, showSuccess } from "./store/slices/toastSlice";
import LoadingSpinner from "./components/LoadingSpinner";
import SkeletonLoader from "./components/SkeletonLoader";
import SystemTest from "./components/SystemTest";
import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";

export default function AdminDashboard() {
  const dispatch = useAppDispatch();
  const {
    stats,
    recentBookings,
    bookingStats,
    topDestinations,
    isLoading,
    error,
  } = useAppSelector((state: any) => state.dashboard);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await dispatch(fetchDashboardData()).unwrap();
        showSuccess(
          "Dashboard loaded successfully",
          "All data has been refreshed"
        );
      } catch (error) {
        showError("Failed to load dashboard", "Please try refreshing the page");
      }
    };

    loadDashboardData();
  }, [dispatch]);

  const handleRefresh = async () => {
    try {
      await dispatch(fetchDashboardData()).unwrap();
      showSuccess("Dashboard refreshed", "Data has been updated");
    } catch (error) {
      showError("Refresh failed", "Please try again");
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <SkeletonLoader
          type="card"
          count={4}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        />

        {/* Charts and Tables Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader type="table" />
          <SkeletonLoader type="chart" />
        </div>

        {/* Top Destinations Skeleton */}
        <SkeletonLoader type="chart" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <Activity className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Failed to Load Dashboard
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Test - Remove in production */}
      <SystemTest />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-gray-900"
            style={{ fontFamily: "Red Hat Display, sans-serif" }}
          >
            Dashboard Overview
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome to the Zen admin dashboard. Here's what's happening with
            your business.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Bookings
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      stats?.totalBookings.toLocaleString()
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 border-t border-gray-100">
            <div className="text-sm">
              <span className="font-medium text-green-700 flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                12% from last month
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      stats?.totalUsers.toLocaleString()
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 border-t border-gray-100">
            <div className="text-sm">
              <span className="font-medium text-green-700 flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                8% from last month
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {isLoading ? (
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      formatCurrency(stats?.totalRevenue || 0)
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 border-t border-gray-100">
            <div className="text-sm">
              <span className="font-medium text-green-700 flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                15% from last month
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Booking Value
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {isLoading ? (
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      formatCurrency(stats?.averageBookingValue || 0)
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-3 border-t border-gray-100">
            <div className="text-sm">
              <span className="font-medium text-red-700 flex items-center">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                3% from last month
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h3
              className="text-lg font-semibold text-gray-900"
              style={{ fontFamily: "Red Hat Display, sans-serif" }}
            >
              Recent Bookings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Latest booking activities
            </p>
          </div>
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Booking
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {recentBookings
                    .slice(0, 5)
                    .map((booking: any, index: number) => (
                      <tr
                        key={booking.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {booking.bookingNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.type} • {formatDate(booking.createdAt)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {booking.customer}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(booking.amount, booking.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Booking Types */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h3
              className="text-lg font-semibold text-gray-900"
              style={{ fontFamily: "Red Hat Display, sans-serif" }}
            >
              Booking Types
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Distribution by booking type
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {bookingStats.map((stat: any, index: number) => (
                <div
                  key={stat.type}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        index === 0
                          ? "bg-orange-500"
                          : index === 1
                          ? "bg-blue-500"
                          : index === 2
                          ? "bg-green-500"
                          : index === 3
                          ? "bg-purple-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    <span className="text-sm font-semibold text-gray-900 capitalize">
                      {stat.type.toLowerCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {stat.count} bookings
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(stat.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Destinations */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3
            className="text-lg font-semibold text-gray-900"
            style={{ fontFamily: "Red Hat Display, sans-serif" }}
          >
            Top Destinations
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Most popular travel destinations
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {topDestinations
              .slice(0, 10)
              .map((destination: any, index: number) => (
                <div
                  key={destination.code}
                  className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full">
                    <span className="text-lg font-bold text-orange-700">
                      {destination.code}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {destination.count} bookings
                  </div>
                  <div className="text-xs text-gray-500 mt-1">#{index + 1}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
