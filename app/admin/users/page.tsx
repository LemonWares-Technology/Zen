"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import { useAppDispatch } from "../store/hooks";
import { showError, showSuccess } from "../store/slices/toastSlice";
import { apiClient } from "@/lib/api-client";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";
import DataTable from "../components/DataTable";
import Tooltip from "../components/Tooltip";
import PageHeader from "../components/PageHeader";
import ActionButton from "../components/ActionButton";
import SearchBar from "../components/SearchBar";
import Modal from "../components/Modal";
import FormField from "../components/FormField";
import Badge from "../components/Badge";
import Card from "../components/Card";
import LoadingButton from "../components/LoadingButton";

interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  isVerified: boolean;
  role: string;
  lastLoginAt: string;
  createdAt: string;
  stats: {
    totalBookings: number;
    totalPayments: number;
  };
}

interface UserStats {
  byRole: Array<{ role: string; count: number }>;
  byVerification: Array<{ isVerified: boolean; count: number }>;
}

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    isActive: "",
    isVerified: "",
    role: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.isActive && { isActive: filters.isActive }),
        ...(filters.isVerified && { isVerified: filters.isVerified }),
        ...(filters.role && { role: filters.role }),
      };

      const data = await apiClient.get<{
        data: {
          users: User[];
          statistics: UserStats;
          pagination: typeof pagination;
        };
      }>("/api/admin/users", params);

      setUsers(data.data.users);
      setStats(data.data.statistics);
      setPagination(data.data.pagination);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch users";
      setError(errorMessage);
      dispatch(showError("Failed to load users", errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);

      await apiClient.patch("/api/admin/users", {
        userId: selectedUser.id,
        ...updatedData,
      });

      setShowEditModal(false);
      setSelectedUser(null);
      dispatch(
        showSuccess(
          "User updated successfully",
          "User information has been updated"
        )
      );
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update user";
      setError(errorMessage);
      dispatch(showError("Failed to update user", errorMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);

      await apiClient.delete("/api/admin/users", { userId: selectedUser.id });

      setShowDeleteModal(false);
      setSelectedUser(null);
      dispatch(
        showSuccess(
          "User deactivated successfully",
          "User has been deactivated"
        )
      );
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to deactivate user";
      setError(errorMessage);
      dispatch(showError("Failed to deactivate user", errorMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRoleVariant = (
    role: string
  ): "default" | "success" | "warning" | "danger" | "info" => {
    switch (role.toLowerCase()) {
      case "admin":
        return "danger";
      case "customer":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and permissions"
        tooltip="View, edit, and manage all user accounts in the system"
        actions={
          <ActionButton
            icon={Plus}
            label="Add User"
            onClick={() => {}}
            variant="primary"
          />
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="By Role" description="User distribution by role">
            <div className="space-y-2">
              {stats.byRole.map((stat) => (
                <div key={stat.role} className="flex justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {stat.role}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="By Verification" description="User verification status">
            <div className="space-y-2">
              {stats.byVerification.map((stat) => (
                <div
                  key={stat.isVerified.toString()}
                  className="flex justify-between"
                >
                  <span className="text-sm text-gray-600">
                    {stat.isVerified ? "Verified" : "Unverified"}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Total Users" description="Overall user count">
            <div className="text-2xl font-bold text-gray-900">
              {pagination.total}
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card
        title="Search & Filters"
        description="Filter users by various criteria"
      >
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange("isActive", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select
              value={filters.isVerified}
              onChange={(e) => handleFilterChange("isVerified", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="CUSTOMER">Customer</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </Card>

      {/* Users Table */}
      <DataTable
        columns={[
          {
            key: "user",
            label: "User",
            render: (_, user) => (
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-600">
                      {user.firstName?.charAt(0)}
                      {user.lastName?.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
            ),
          },
          {
            key: "role",
            label: "Role",
            render: (_, user) => (
              <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
            ),
            mobileHidden: true,
          },
          {
            key: "status",
            label: "Status",
            render: (_, user) => (
              <div className="flex items-center space-x-2">
                {user.isActive ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                {user.isVerified ? (
                  <UserCheck className="h-4 w-4 text-blue-500" />
                ) : (
                  <UserX className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ),
          },
          {
            key: "bookings",
            label: "Bookings",
            render: (_, user) => (
              <div className="text-sm text-gray-900">
                {user.stats.totalBookings}
              </div>
            ),
            mobileHidden: true,
          },
          {
            key: "lastLogin",
            label: "Last Login",
            render: (_, user) => (
              <div className="text-sm text-gray-500">
                {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
              </div>
            ),
            mobileHidden: true,
          },
        ]}
        data={users}
        loading={loading}
        emptyMessage="No users found"
        actions={(user) => (
          <div className="flex items-center space-x-2">
            <ActionButton
              icon={Edit}
              label=""
              onClick={() => handleEditUser(user)}
              variant="secondary"
              size="sm"
              tooltip="Edit user"
            />
            <ActionButton
              icon={Trash2}
              label=""
              onClick={() => handleDeleteUser(user)}
              variant="danger"
              size="sm"
              tooltip="Delete user"
            />
          </div>
        )}
      />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateUser}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <DeleteUserModal
          user={selectedUser}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteUserConfirm}
        />
      )}
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (data: Partial<User>) => void;
}) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    isVerified: user.isVerified,
    role: user.role,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isVerified: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200"
                />
                <span className="ml-2 text-sm text-gray-700">Verified</span>
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Delete User Modal Component
function DeleteUserModal({
  user,
  onClose,
  onConfirm,
}: {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Delete User
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to deactivate user{" "}
            <strong>{user.name}</strong>? This action will prevent them from
            logging in but will not delete their data.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Deactivate User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
