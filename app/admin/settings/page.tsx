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
      const response = await fetch("/api/admin/settings");
      const data = await response.json();

      if (response.ok) {
        setSystemData(data.data);
      } else {
        setError(data.message || "Failed to fetch system data");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSystemAction = async (action: string, data?: any) => {
    try {
      setActionLoading(action);
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, data }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || "Action completed successfully");
        if (action === "backup" || action === "clear_cache") {
          fetchSystemData(); // Refresh data after these actions
        }
      } else {
        alert(result.message || "Action failed");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setActionLoading(null);
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
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
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
      <div>
        <h1
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "Red Hat Display, sans-serif" }}
        >
          System Settings
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Monitor system performance and manage administrative tasks
        </p>
      </div>

      {/* System Overview */}
      {systemData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Server className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      System Uptime
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {systemData.system.systemUptime}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Response Time
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {systemData.system.averageResponseTime}ms
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Error Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {systemData.system.errorRate}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Database className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(systemData.system.totalRevenue)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Statistics */}
      {systemData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Statistics
            </h3>
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
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity (24h)
            </h3>
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
          </div>
        </div>
      )}

      {/* System Alerts */}
      {systemData && systemData.alerts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Alerts
          </h3>
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
        </div>
      )}

      {/* Maintenance Information */}
      {systemData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Maintenance Information
          </h3>
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
        </div>
      )}

      {/* System Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleSystemAction("backup")}
            disabled={actionLoading === "backup"}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === "backup" ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mr-2"></div>
            ) : (
              <Download className="h-5 w-5 text-gray-400 mr-2" />
            )}
            <span className="text-sm font-medium text-gray-700">
              Create Backup
            </span>
          </button>

          <button
            onClick={() => handleSystemAction("clear_cache")}
            disabled={actionLoading === "clear_cache"}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === "clear_cache" ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mr-2"></div>
            ) : (
              <RefreshCw className="h-5 w-5 text-gray-400 mr-2" />
            )}
            <span className="text-sm font-medium text-gray-700">
              Clear Cache
            </span>
          </button>

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
      </div>

      {/* Performance Metrics */}
      {systemData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Metrics
          </h3>
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
        </div>
      )}

      {/* Security Settings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Security Settings
        </h3>
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
      </div>
    </div>
  );
}
