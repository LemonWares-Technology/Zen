"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Calendar,
  CreditCard,
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

interface Customer {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
  stats: {
    totalBookings: number;
    totalPayments: number;
  };
}

interface CustomerStats {
  byVerification: Array<{ isVerified: boolean; count: number }>;
  byActive: Array<{ isActive: boolean; count: number }>;
}

export default function CustomersPage() {
  const dispatch = useAppDispatch();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    isActive: "",
    isVerified: "",
    hasBookings: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, filters, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.isActive && { isActive: filters.isActive }),
        ...(filters.isVerified && { isVerified: filters.isVerified }),
        ...(filters.hasBookings && { hasBookings: filters.hasBookings }),
      };

      const data = await apiClient.get<{
        data: {
          customers: Customer[];
          statistics: CustomerStats;
          pagination: typeof pagination;
        };
      }>("/api/admin/customers", params);

      setCustomers(data.data.customers);
      setStats(data.data.statistics);
      setPagination(data.data.pagination);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch customers";
      setError(errorMessage);
      dispatch(showError("Failed to load customers", errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleUpdateCustomer = async (updatedData: Partial<Customer>) => {
    if (!selectedCustomer) return;

    try {
      setActionLoading(true);

      await apiClient.patch("/api/admin/customers", {
        customerId: selectedCustomer.id,
        ...updatedData,
      });

      setShowEditModal(false);
      setSelectedCustomer(null);
      dispatch(
        showSuccess(
          "Customer updated successfully",
          "Customer information has been updated"
        )
      );
      fetchCustomers();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update customer";
      setError(errorMessage);
      dispatch(showError("Failed to update customer", errorMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCustomerConfirm = async () => {
    if (!selectedCustomer) return;

    try {
      setActionLoading(true);

      await apiClient.delete("/api/admin/customers", {
        customerId: selectedCustomer.id,
      });

      setShowDeleteModal(false);
      setSelectedCustomer(null);
      dispatch(
        showSuccess(
          "Customer deactivated successfully",
          "Customer has been deactivated"
        )
      );
      fetchCustomers();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to deactivate customer";
      setError(errorMessage);
      dispatch(showError("Failed to deactivate customer", errorMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCustomer = async (customerData: Partial<Customer>) => {
    try {
      setActionLoading(true);

      await apiClient.post("/api/admin/customers", customerData);

      setShowCreateModal(false);
      dispatch(
        showSuccess(
          "Customer created successfully",
          "New customer has been added"
        )
      );
      fetchCustomers();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create customer";
      setError(errorMessage);
      dispatch(showError("Failed to create customer", errorMessage));
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Customer Management"
        description="Manage customer accounts and track their activity"
        tooltip="View, edit, and manage all customer accounts in the system"
        actions={
          <ActionButton
            icon={Plus}
            label="Add Customer"
            onClick={() => setShowCreateModal(true)}
            variant="primary"
          />
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            title="By Verification Status"
            description="Customer verification distribution"
          >
            <div className="space-y-3">
              {stats.byVerification.map((stat) => (
                <div
                  key={stat.isVerified.toString()}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center">
                    {stat.isVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-600">
                      {stat.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card
            title="By Active Status"
            description="Customer activity distribution"
          >
            <div className="space-y-3">
              {stats.byActive.map((stat) => (
                <div
                  key={stat.isActive.toString()}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center">
                    {stat.isActive ? (
                      <UserCheck className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <UserX className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-600">
                      {stat.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Total Customers" description="Overall customer count">
            <div className="text-2xl font-bold text-gray-900">
              {pagination.total}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {customers.filter((c) => c.stats.totalBookings > 0).length} with
              bookings
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card
        title="Search & Filters"
        description="Filter customers by various criteria"
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
                placeholder="Search customers by name, email, or phone..."
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
              value={filters.hasBookings}
              onChange={(e) =>
                handleFilterChange("hasBookings", e.target.value)
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Customers</option>
              <option value="true">With Bookings</option>
              <option value="false">No Bookings</option>
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

      {/* Customers Table */}
      <DataTable
        columns={[
          {
            key: "customer",
            label: "Customer",
            render: (_, customer) => (
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-600">
                      {customer.firstName?.charAt(0)}
                      {customer.lastName?.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {customer.name}
                  </div>
                  <div className="text-sm text-gray-500">{customer.email}</div>
                  {customer.phone && (
                    <div className="text-sm text-gray-500">
                      {customer.phone}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (_, customer) => (
              <div className="flex items-center space-x-2">
                {customer.isActive ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                {customer.isVerified ? (
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
            render: (_, customer) => (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">
                  {customer.stats.totalBookings}
                </span>
              </div>
            ),
            mobileHidden: true,
          },
          {
            key: "payments",
            label: "Payments",
            render: (_, customer) => (
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">
                  {customer.stats.totalPayments}
                </span>
              </div>
            ),
            mobileHidden: true,
          },
          {
            key: "lastLogin",
            label: "Last Login",
            render: (_, customer) => (
              <div className="text-sm text-gray-500">
                {customer.lastLoginAt
                  ? formatDate(customer.lastLoginAt)
                  : "Never"}
              </div>
            ),
            mobileHidden: true,
          },
          {
            key: "joined",
            label: "Joined",
            render: (_, customer) => (
              <div className="text-sm text-gray-500">
                {formatDate(customer.createdAt)}
              </div>
            ),
            mobileHidden: true,
          },
        ]}
        data={customers}
        loading={loading}
        emptyMessage="No customers found"
        actions={(customer) => (
          <div className="flex items-center space-x-2">
            <ActionButton
              icon={Edit}
              label=""
              onClick={() => handleEditCustomer(customer)}
              variant="secondary"
              size="sm"
              tooltip="Edit customer"
            />
            <ActionButton
              icon={Trash2}
              label=""
              onClick={() => handleDeleteCustomer(customer)}
              variant="danger"
              size="sm"
              tooltip="Delete customer"
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
      {showEditModal && selectedCustomer && (
        <EditCustomerModal
          customer={selectedCustomer}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateCustomer}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedCustomer && (
        <DeleteCustomerModal
          customer={selectedCustomer}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteCustomerConfirm}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCustomerModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateCustomer}
        />
      )}
    </div>
  );
}

// Edit Customer Modal Component
function EditCustomerModal({
  customer,
  onClose,
  onSave,
}: {
  customer: Customer;
  onClose: () => void;
  onSave: (data: Partial<Customer>) => void;
}) {
  const [formData, setFormData] = useState({
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    isActive: customer.isActive,
    isVerified: customer.isVerified,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Edit Customer
          </h3>
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
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Delete Customer Modal Component
function DeleteCustomerModal({
  customer,
  onClose,
  onConfirm,
}: {
  customer: Customer;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Delete Customer
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to deactivate customer{" "}
            <strong>{customer.name}</strong>? This action will prevent them from
            logging in but will not delete their data.
            {customer.stats.totalBookings > 0 && (
              <span className="block mt-2 text-red-600">
                Warning: This customer has {customer.stats.totalBookings}{" "}
                booking(s).
              </span>
            )}
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
              Deactivate Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Customer Modal Component
function CreateCustomerModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: Partial<Customer>) => void;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    isActive: true,
    isVerified: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Create Customer
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                required
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
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                required
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
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                placeholder="Leave empty for default password"
              />
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
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
              >
                Create Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
