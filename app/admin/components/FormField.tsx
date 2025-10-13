"use client";

import { ReactNode } from "react";
import Tooltip from "./Tooltip";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  helpText?: string;
  required?: boolean;
  tooltip?: string;
  className?: string;
}

export default function FormField({
  label,
  children,
  error,
  helpText,
  required = false,
  tooltip,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 flex items-center">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {tooltip && <Tooltip content={tooltip} iconOnly />}
      </label>

      <div className="relative">{children}</div>

      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center">
          <span className="mr-1">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
