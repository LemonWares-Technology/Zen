"use client";

import { LucideIcon } from "lucide-react";
import { ButtonHTMLAttributes } from "react";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  tooltip?: string;
}

export default function ActionButton({
  icon: Icon,
  label,
  variant = "primary",
  size = "md",
  loading = false,
  tooltip,
  className = "",
  disabled,
  ...props
}: ActionButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary:
      "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
    ${className}
  `.trim();

  const iconClasses = `${iconSizes[size]} ${loading ? "animate-spin" : ""}`;

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      title={tooltip}
      {...props}
    >
      <Icon className={`${iconClasses} ${label ? "mr-2" : ""}`} />
      {label}
    </button>
  );
}
