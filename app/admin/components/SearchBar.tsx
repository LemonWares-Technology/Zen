"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
  onClear,
  className = "",
  size = "md",
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const handleClear = () => {
    onChange("");
    onClear?.();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`${iconSizes[size]} text-gray-400`} />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          block w-full pl-10 pr-10 border border-gray-300 rounded-md shadow-sm
          focus:ring-2 focus:ring-orange-500 focus:border-orange-500
          transition-all duration-200
          ${sizeClasses[size]}
          ${isFocused ? "ring-2 ring-orange-500 border-orange-500" : ""}
        `}
      />
      {value && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className={`${iconSizes[size]}`} />
          </button>
        </div>
      )}
    </div>
  );
}
