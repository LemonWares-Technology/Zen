"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
  mobileHidden?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  actions?: (row: any) => React.ReactNode;
  className?: string;
}

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  actions,
  className = "",
}: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const visibleColumns = columns.filter((col) => !col.mobileHidden);
  const mobileHiddenColumns = columns.filter((col) => col.mobileHidden);

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      >
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                  } ${column.className || ""}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={`h-3 w-3 ${
                            sortColumn === column.key && sortDirection === "asc"
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        />
                        <ChevronDown
                          className={`h-3 w-3 -mt-1 ${
                            sortColumn === column.key &&
                            sortDirection === "desc"
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row, index) => (
              <tr
                key={row.id || index}
                className={`hover:bg-gray-50 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap ${
                      column.className || ""
                    }`}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {sortedData.map((row, index) => {
          const isExpanded = expandedRows.has(row.id || index.toString());
          return (
            <div
              key={row.id || index}
              className="border-b border-gray-200 last:border-b-0"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {visibleColumns.slice(0, 2).map((column) => (
                      <div key={column.key} className="mb-2 last:mb-0">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {column.label}
                        </div>
                        <div className="text-sm text-gray-900 truncate">
                          {column.render
                            ? column.render(row[column.key], row)
                            : row[column.key]}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {actions && (
                      <div className="flex-shrink-0">{actions(row)}</div>
                    )}
                    {mobileHiddenColumns.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpansion(row.id || index.toString());
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && mobileHiddenColumns.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 gap-3">
                      {mobileHiddenColumns.map((column) => (
                        <div key={column.key}>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {column.label}
                          </div>
                          <div className="text-sm text-gray-900">
                            {column.render
                              ? column.render(row[column.key], row)
                              : row[column.key]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-gray-500 text-sm">{emptyMessage}</div>
        </div>
      )}
    </div>
  );
}
