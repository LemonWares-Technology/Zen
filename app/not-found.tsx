"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Log 404 errors for analytics
    console.warn("404 Page Not Found - User navigated to non-existent page");
  }, []);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleSearch = () => {
    router.push("/search");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="mx-auto h-20 w-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl mb-8">
          <span className="text-3xl font-bold text-white">Z</span>
        </div>

        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-gray-200 select-none">
            404
          </div>
          <div className="text-2xl font-semibold text-gray-800 mt-4 mb-2">
            Page Not Found
          </div>
          <p className="text-gray-600 leading-relaxed">
            Sorry, we couldn't find the page you're looking for. The page might
            have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <button
            onClick={handleGoHome}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Home className="h-5 w-5 mr-2" />
            Go Home
          </button>

          <button
            onClick={handleGoBack}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <button
              onClick={handleSearch}
              className="flex items-center hover:text-orange-600 transition-colors duration-200"
            >
              <Search className="h-4 w-4 mr-1" />
              Search
            </button>
            <a
              href="/help"
              className="flex items-center hover:text-orange-600 transition-colors duration-200"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Help Center
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-400">
          <p>© 2024 Zen Travel. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
