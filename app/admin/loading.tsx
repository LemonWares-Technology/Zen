"use client";

import LoadingSpinner from "./components/LoadingSpinner";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
          <span className="text-2xl font-bold text-white">Z</span>
        </div>
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
        <p className="mt-4 text-sm text-gray-600">
          Please wait while we prepare your dashboard
        </p>
      </div>
    </div>
  );
}
