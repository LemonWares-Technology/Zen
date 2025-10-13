"use client";

import { ReactNode } from "react";
import Tooltip from "./Tooltip";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  tooltip?: string;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  actions,
  tooltip,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0 ${className}`}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-sans flex items-center">
          {title}
          {tooltip && <Tooltip content={tooltip} iconOnly />}
        </h1>
        {description && (
          <p className="mt-2 text-gray-600 text-sm sm:text-base">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
}
