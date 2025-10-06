"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Admin Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full text-center">
        {/* Error Icon */}
        <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center shadow-lg mb-8">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Admin Dashboard Error
          </h1>
          <p className="text-gray-600 leading-relaxed mb-4">
            Something went wrong in the admin dashboard. This error has been logged and our team will investigate.
          </p>
          
          {error.digest && (
            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Error ID:</span> {error.digest}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <button
            onClick={reset}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = "/"}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Home className="h-5 w-5 mr-2" />
            Go Home
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>If this problem persists, please contact support.</p>
        </div>
      </div>
    </div>
  );
}
