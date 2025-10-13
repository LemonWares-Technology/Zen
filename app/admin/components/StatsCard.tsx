"use client";

import { LucideIcon } from "lucide-react";
import Tooltip from "./Tooltip";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  loading?: boolean;
  tooltip?: string;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor,
  trend,
  loading = false,
  tooltip,
  className = "",
}: StatsCardProps) {
  if (loading) {
    return (
      <div
        className={`bg-white overflow-hidden shadow-sm border border-gray-200 rounded-xl ${className}`}
      >
        <div className="p-4 sm:p-6">
          <div className="animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white overflow-hidden shadow-sm border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div
              className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${iconColor}`}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-current" />
            </div>
          </div>
          <div className="ml-3 sm:ml-5 w-0 flex-1">
            <dl>
              <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate flex items-center">
                {title}
                {tooltip && <Tooltip content={tooltip} iconOnly />}
              </dt>
              <dd className="text-lg sm:text-2xl font-bold text-gray-900">
                {value}
              </dd>
              {trend && (
                <dd className="text-xs sm:text-sm text-gray-500 mt-1">
                  <span
                    className={`inline-flex items-center ${
                      trend.isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {trend.isPositive ? "+" : ""}
                    {trend.value}% {trend.label}
                  </span>
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
