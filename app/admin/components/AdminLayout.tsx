"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { checkAuth } from "../store/slices/authSlice";
import { setOpen } from "../store/slices/sidebarSlice";
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
  const router = useRouter();
  const { isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );
  const { isCollapsed } = useAppSelector((state) => state.sidebar);
  const [isClient, setIsClient] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check if we're on the login page
  const isLoginPage =
    typeof window !== "undefined" &&
    window.location.pathname === "/admin/login";

  // Set client-side flag and handle responsive sidebar
  useEffect(() => {
    setIsClient(true);

    // Set initial sidebar state based on screen size
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop: sidebar should be open
        dispatch(setOpen(true));
      } else {
        // Mobile: sidebar should be closed
        dispatch(setOpen(false));
      }
    };

    // Set initial state
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [dispatch]);

  // Ensure sidebar is properly set when authenticated and not on login page
  useEffect(() => {
    if (isClient && isAuthenticated && !isLoginPage) {
      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          // Desktop: sidebar should be open
          dispatch(setOpen(true));
        } else {
          // Mobile: sidebar should be closed
          dispatch(setOpen(false));
        }
      };
      handleResize();
    }
  }, [isClient, isAuthenticated, isLoginPage, dispatch]);

  // Check authentication only once (skip on login page)
  useEffect(() => {
    if (isClient && !authChecked && !isLoginPage) {
      setAuthChecked(true);
      dispatch(checkAuth());
    } else if (isClient && isLoginPage) {
      setAuthChecked(true);
    }
  }, [isClient, authChecked, dispatch, isLoginPage]);

  // Handle redirect to login (skip on login page)
  useEffect(() => {
    if (
      isClient &&
      authChecked &&
      !isAuthenticated &&
      !isLoading &&
      !isLoginPage
    ) {
      console.log("Redirecting to login - not authenticated");
      router.replace("/admin/login");
    }
  }, [isClient, authChecked, isAuthenticated, isLoading, router, isLoginPage]);

  // Show loading state during initial load (skip on login page)
  if (!isClient || (authChecked && isLoading && !isLoginPage)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Show redirecting state if not authenticated (skip on login page)
  if (authChecked && !isAuthenticated && !isLoading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If on login page, render children without admin layout
  if (isLoginPage) {
    return (
      <ErrorBoundary>
        <ToastContainer />
        {children}
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div
          className={`
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "lg:pl-16" : "lg:pl-64"}
          pl-0
        `}
        >
          <TopNavigation />
          <main className="flex-1 min-h-screen">
            <div className="py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
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
