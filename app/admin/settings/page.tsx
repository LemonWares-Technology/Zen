"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Shield,
  Bell,
  Download,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { useAppDispatch } from "../store/hooks";
import { showError, showSuccess } from "../store/slices/toastSlice";
import { apiClient } from "@/lib/api-client";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";
import PageHeader from "../components/PageHeader";
import ActionButton from "../components/ActionButton";
import Tooltip from "../components/Tooltip";
import StatsCard from "../components/StatsCard";
import Modal from "../components/Modal";
import FormField from "../components/FormField";
import Card from "../components/Card";
import Badge from "../components/Badge";
import LoadingButton from "../components/LoadingButton";

interface SystemData {
  system: {
    totalBookings: number;
    totalUsers: number;
    totalPayments: number;
    totalRevenue: number;
    systemUptime: number;
    averageResponseTime: number;
    errorRate: number;
  };
  activity: {
    recentBookings: number;
    recentUsers: number;
    recentPayments: number;
    bookingGrowthRate: number;
    userGrowthRate: number;
    revenueGrowthRate: number;
  };
  performance: {
    averageBookingValue: number;
    peakHours: number[];
    busiestDays: string[];
  };
  alerts: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
  maintenance: {
    nextScheduled: string;
    lastBackup: string;
    backupStatus: string;
  };
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiClient.get<{ data: SystemData }>(
        "/api/admin/settings"
      );

      setSystemData(data.data);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch system data";
      setError(errorMessage);
      dispatch(showError("Failed to load system data", errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleSystemAction = async (action: string, data?: any) => {
    try {
      setActionLoading(action);

      const result = await apiClient.post<{ message: string }>(
        "/api/admin/settings",
        {
          action,
          data,
        }
      );

      dispatch(
        showSuccess(
          "Action completed",
          result.message || "Action completed successfully"
        )
      );
      if (action === "backup" || action === "clear_cache") {
        fetchSystemData(); // Refresh data after these actions
      }
    } catch (error: any) {
      const errorMessage = error.message || "Action failed";
      dispatch(showError("Action failed", errorMessage));
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAlertIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "success":
        return "bg-green-50 border-green-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  if (loading) {
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

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="System Settings"
        description="Monitor system performance and manage administrative tasks"
        tooltip="Monitor system health, manage settings, and perform administrative tasks"
      />

      {/* System Overview */}
      {systemData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="System Uptime"
            value={`${systemData.system.systemUptime}%`}
            icon={Server}
            iconColor="text-blue-600"
            tooltip="System availability percentage"
          />

          <StatsCard
            title="Response Time"
            value={`${systemData.system.averageResponseTime}ms`}
            icon={Activity}
            iconColor="text-green-600"
            tooltip="Average system response time"
          />

          <StatsCard
            title="Error Rate"
            value={`${systemData.system.errorRate}%`}
            icon={AlertTriangle}
            iconColor="text-red-600"
            tooltip="System error rate percentage"
          />

          <StatsCard
            title="Total Revenue"
            value={formatCurrency(systemData.system.totalRevenue)}
            icon={Database}
            iconColor="text-purple-600"
            tooltip="Total revenue generated by the system"
          />
        </div>
      )}

      {/* System Statistics */}
      {systemData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="System Statistics"
            description="Key system metrics and performance indicators"
          >
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Bookings</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemData.system.totalBookings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Users</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemData.system.totalUsers.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Payments</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemData.system.totalPayments.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Average Booking Value
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(systemData.performance.averageBookingValue)}
                </span>
              </div>
            </div>
          </Card>

          <Card
            title="Recent Activity (24h)"
            description="System activity in the last 24 hours"
          >
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Bookings</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemData.activity.recentBookings}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Users</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemData.activity.recentUsers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Payments</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemData.activity.recentPayments}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue Growth</span>
                <span className="text-sm font-medium text-green-600">
                  +{systemData.activity.revenueGrowthRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* System Alerts */}
      {systemData && systemData.alerts.length > 0 && (
        <Card
          title="System Alerts"
          description="Current system alerts and notifications"
        >
          <div className="space-y-3">
            {systemData.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start">
                  {getAlertIcon(alert.type)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(alert.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Maintenance Information */}
      {systemData && (
        <Card
          title="Maintenance Information"
          description="System maintenance schedule and status"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Next Scheduled Maintenance
              </h4>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">
                  {formatDate(systemData.maintenance.nextScheduled)}
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Last Backup
              </h4>
              <div className="flex items-center">
                <Database className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">
                  {formatDate(systemData.maintenance.lastBackup)}
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Backup Status
              </h4>
              <div className="flex items-center">
                {systemData.maintenance.backupStatus === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                )}
                <span className="text-sm text-gray-900 capitalize">
                  {systemData.maintenance.backupStatus}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* System Actions */}
      <Card
        title="System Actions"
        description="Administrative actions and system maintenance"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingButton
            onClick={() => handleSystemAction("backup")}
            loading={actionLoading === "backup"}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Create Backup
            </span>
          </LoadingButton>

          <LoadingButton
            onClick={() => handleSystemAction("clear_cache")}
            loading={actionLoading === "clear_cache"}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Clear Cache
            </span>
          </LoadingButton>

          <button
            onClick={() =>
              handleSystemAction("maintenance", {
                enabled: true,
                message: "System under maintenance",
                duration: "2 hours",
              })
            }
            disabled={actionLoading === "maintenance"}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === "maintenance" ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mr-2"></div>
            ) : (
              <Wrench className="h-5 w-5 text-gray-400 mr-2" />
            )}
            <span className="text-sm font-medium text-gray-700">
              Maintenance Mode
            </span>
          </button>

          <button
            onClick={() =>
              handleSystemAction("send_notification", {
                recipients: "all_users",
                type: "info",
                message: "System notification",
              })
            }
            disabled={actionLoading === "send_notification"}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === "send_notification" ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mr-2"></div>
            ) : (
              <Bell className="h-5 w-5 text-gray-400 mr-2" />
            )}
            <span className="text-sm font-medium text-gray-700">
              Send Notification
            </span>
          </button>
        </div>
      </Card>

      {/* Performance Metrics */}
      {systemData && (
        <Card
          title="Performance Metrics"
          description="System performance indicators and analytics"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Peak Hours
              </h4>
              <div className="flex flex-wrap gap-2">
                {systemData.performance.peakHours.map((hour) => (
                  <span
                    key={hour}
                    className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800"
                  >
                    {hour}:00
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Busiest Days
              </h4>
              <div className="flex flex-wrap gap-2">
                {systemData.performance.busiestDays.map((day) => (
                  <span
                    key={day}
                    className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Security Settings */}
      <Card
        title="Security Settings"
        description="Configure security options and authentication settings"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Two-Factor Authentication
              </h4>
              <p className="text-sm text-gray-500">
                Require 2FA for admin accounts
              </p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-orange-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
              <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Session Timeout
              </h4>
              <p className="text-sm text-gray-500">
                Auto-logout after 30 minutes of inactivity
              </p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
              <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                IP Whitelist
              </h4>
              <p className="text-sm text-gray-500">
                Restrict admin access to specific IP addresses
              </p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
              <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
