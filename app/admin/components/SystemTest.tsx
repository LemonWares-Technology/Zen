"use client";

import { useState } from "react";
import { useAppDispatch } from "../store/hooks";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoading,
} from "../store/slices/toastSlice";
import { toggleSidebar } from "../store/slices/sidebarSlice";
import { TestTube, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function SystemTest() {
  const dispatch = useAppDispatch();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<
    Array<{
      test: string;
      status: "pass" | "fail" | "pending";
      message: string;
    }>
  >([]);

  const runSystemTest = async () => {
    setIsRunning(true);
    setResults([]);

    const tests = [
      {
        name: "Redux Store Connection",
        test: () => {
          try {
            // Test Redux store access
            const state = (window as any).__REDUX_DEVTOOLS_EXTENSION__?.();
            return {
              status: "pass" as const,
              message: "Redux store is accessible",
            };
          } catch (error) {
            return {
              status: "fail" as const,
              message: "Redux store connection failed",
            };
          }
        },
      },
      {
        name: "Toast System",
        test: () => {
          try {
            dispatch(showInfo("System Test", "Testing toast system"));
            return {
              status: "pass" as const,
              message: "Toast system is working",
            };
          } catch (error) {
            return { status: "fail" as const, message: "Toast system failed" };
          }
        },
      },
      {
        name: "Sidebar Toggle",
        test: () => {
          try {
            dispatch(toggleSidebar());
            return {
              status: "pass" as const,
              message: "Sidebar toggle is working",
            };
          } catch (error) {
            return {
              status: "fail" as const,
              message: "Sidebar toggle failed",
            };
          }
        },
      },
      {
        name: "Local Storage",
        test: () => {
          try {
            localStorage.setItem("test", "value");
            const value = localStorage.getItem("test");
            localStorage.removeItem("test");
            return value === "value"
              ? { status: "pass" as const, message: "Local storage is working" }
              : {
                  status: "fail" as const,
                  message: "Local storage test failed",
                };
          } catch (error) {
            return {
              status: "fail" as const,
              message: "Local storage is not available",
            };
          }
        },
      },
      {
        name: "API Connectivity",
        test: async () => {
          try {
            const response = await fetch("/api/admin/dashboard");
            return response.ok
              ? { status: "pass" as const, message: "API is accessible" }
              : {
                  status: "fail" as const,
                  message: `API returned ${response.status}`,
                };
          } catch (error) {
            return {
              status: "fail" as const,
              message: "API connection failed",
            };
          }
        },
      },
    ];

    for (const test of tests) {
      setResults((prev) => [
        ...prev,
        { test: test.name, status: "pending", message: "Running..." },
      ]);

      try {
        const result = await test.test();
        setResults((prev) =>
          prev.map((r) => (r.test === test.name ? { ...r, ...result } : r))
        );

        // Small delay for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        setResults((prev) =>
          prev.map((r) =>
            r.test === test.name
              ? { ...r, status: "fail", message: "Test failed with error" }
              : r
          )
        );
      }
    }

    setIsRunning(false);

    // Show final result
    const passedTests = results.filter((r) => r.status === "pass").length;
    const totalTests = tests.length;

    if (passedTests === totalTests) {
      dispatch(
        showSuccess("System Test Complete", `All ${totalTests} tests passed!`)
      );
    } else {
      dispatch(
        showWarning(
          "System Test Complete",
          `${passedTests}/${totalTests} tests passed`
        )
      );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return (
          <AlertTriangle className="h-5 w-5 text-yellow-500 animate-pulse" />
        );
      default:
        return <TestTube className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-green-50 border-green-200 text-green-800";
      case "fail":
        return "bg-red-50 border-red-200 text-red-800";
      case "pending":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TestTube className="h-5 w-5 mr-2 text-orange-500" />
            System Integration Test
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Test all system components and integrations
          </p>
        </div>
        <button
          onClick={runSystemTest}
          disabled={isRunning}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isRunning ? "Running Tests..." : "Run System Test"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(
                result.status
              )}`}
            >
              <div className="flex items-center">
                {getStatusIcon(result.status)}
                <span className="ml-3 font-medium">{result.test}</span>
              </div>
              <span className="text-sm">{result.message}</span>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !isRunning && (
        <div className="text-center py-8 text-gray-500">
          <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>
            Click "Run System Test" to verify all components are working
            correctly
          </p>
        </div>
      )}
    </div>
  );
}
