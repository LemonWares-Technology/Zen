"use client";

import { useAppSelector, useAppDispatch } from "../store/hooks";
import { toggleSidebar, collapseSidebar } from "../store/slices/sidebarSlice";
import { logout } from "../store/slices/authSlice";
import { fetchDashboardData } from "../store/slices/dashboardSlice";

export default function ReduxTestComponent() {
  const dispatch = useAppDispatch();
  const sidebarState = useAppSelector((state) => state.sidebar);
  const authState = useAppSelector((state) => state.auth);

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-4">Redux State Test</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Sidebar State</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Is Open: {sidebarState.isOpen ? "Yes" : "No"}</p>
            <p>Is Collapsed: {sidebarState.isCollapsed ? "Yes" : "No"}</p>
          </div>
          <div className="mt-2 space-x-2">
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
            >
              Toggle Sidebar
            </button>
            <button
              onClick={() => dispatch(collapseSidebar())}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Collapse Sidebar
            </button>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Auth State</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Is Authenticated: {authState.isAuthenticated ? "Yes" : "No"}</p>
            <p>Is Loading: {authState.isLoading ? "Yes" : "No"}</p>
            <p>User: {authState.user?.email || "None"}</p>
            <p>Error: {authState.error || "None"}</p>
          </div>
          <div className="mt-2">
            <button
              onClick={() => dispatch(logout())}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <p>
          This component tests Redux state management. Remove it in production.
        </p>
      </div>
    </div>
  );
}
