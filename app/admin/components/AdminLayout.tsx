"use client";

import { ReactNode, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { checkAuth } from "../store/slices/authSlice";
import Sidebar from "./Sidebar";
import TopNavigation from "./TopNavigation";
import ToastContainer from "./ToastContainer";
import ErrorBoundary from "./ErrorBoundary";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { isCollapsed } = useAppSelector((state) => state.sidebar);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div
          className={`
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "lg:pl-16" : "lg:pl-64"}
        `}
        >
          <TopNavigation />
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <ErrorBoundary>{children}</ErrorBoundary>
              </div>
            </div>
          </main>
        </div>
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
