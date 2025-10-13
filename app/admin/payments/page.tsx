"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Banknote,
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

interface Payment {
  id: string;
  bookingId: string;
  userId?: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  transactionId?: string;
  status: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    bookingNumber: string;
    type: string;
    status: string;
    customer: string;
    email: string;
  };
}

interface PaymentStats {
  byStatus: Array<{ status: string; count: number; totalAmount: number }>;
  byMethod: Array<{ method: string; count: number; totalAmount: number }>;
}

export default function PaymentsPage() {
  const dispatch = useAppDispatch();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    method: "",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, filters, searchTerm]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.status && { status: filters.status }),
        ...(filters.method && { method: filters.method }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.minAmount && { minAmount: filters.minAmount }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount }),
      };

      const data = await apiClient.get<{
        data: {
          payments: Payment[];
          statistics: PaymentStats;
          pagination: typeof pagination;
        };
      }>("/api/admin/payments", params);

      setPayments(data.data.payments);
      setStats(data.data.statistics);
      setPagination(data.data.pagination);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch payments";
      setError(errorMessage);
      dispatch(showError("Failed to load payments", errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPayments();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowEditModal(true);
  };

  const handleDeletePayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDeleteModal(true);
  };

  const handleUpdatePayment = async (updatedData: Partial<Payment>) => {
    if (!selectedPayment) return;

    try {
      setActionLoading(true);

      await apiClient.patch("/api/admin/payments", {
        paymentId: selectedPayment.id,
        ...updatedData,
      });

      setShowEditModal(false);
      setSelectedPayment(null);
      dispatch(
        showSuccess(
          "Payment updated successfully",
          "Payment information has been updated"
        )
      );
      fetchPayments();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update payment";
      setError(errorMessage);
      dispatch(showError("Failed to update payment", errorMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePaymentConfirm = async () => {
    if (!selectedPayment) return;

    try {
      setActionLoading(true);

      await apiClient.delete("/api/admin/payments", {
        paymentId: selectedPayment.id,
      });

      setShowDeleteModal(false);
      setSelectedPayment(null);
      dispatch(
        showSuccess("Payment deleted successfully", "Payment has been removed")
      );
      fetchPayments();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete payment";
      setError(errorMessage);
      dispatch(showError("Failed to delete payment", errorMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "refunded":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "paypal":
        return <Banknote className="h-4 w-4" />;
      case "bank_transfer":
        return <Banknote className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Payment Management"
        description="Track and manage all payment transactions"
        tooltip="View, edit, and manage all payment transactions in the system"
        actions={
          <ActionButton
            icon={CreditCard}
            label="Create Payment"
            onClick={() => setShowCreateModal(true)}
            variant="primary"
          />
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="By Status" description="Payment distribution by status">
            <div className="space-y-3">
              {stats.byStatus.map((stat) => (
                <div
                  key={stat.status}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center">
                    {getStatusIcon(stat.status)}
                    <span className="ml-2 text-sm text-gray-600 capitalize">
                      {stat.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {stat.count}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(stat.totalAmount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="By Method" description="Payment distribution by method">
            <div className="space-y-3">
              {stats.byMethod.map((stat) => (
                <div
                  key={stat.method}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center">
                    {getMethodIcon(stat.method)}
                    <span className="ml-2 text-sm text-gray-600 capitalize">
                      {stat.method.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {stat.count}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(stat.totalAmount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card
        title="Search & Filters"
        description="Filter payments by various criteria"
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments by transaction ID, booking number, or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <select
                value={filters.method}
                onChange={(e) => handleFilterChange("method", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Methods</option>
                <option value="CARD">Card</option>
                <option value="PAYPAL">PayPal</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Amount
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={filters.minAmount}
                onChange={(e) =>
                  handleFilterChange("minAmount", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Amount
              </label>
              <input
                type="number"
                placeholder="1000.00"
                value={filters.maxAmount}
                onChange={(e) =>
                  handleFilterChange("maxAmount", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </form>
      </Card>

      {/* Payments Table */}
      <DataTable
        columns={[
          {
            key: "transaction",
            label: "Transaction",
            render: (_, payment) => (
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {payment.transactionId || `PAY-${payment.id.slice(-8)}`}
                </div>
                <div className="text-sm text-gray-500">{payment.provider}</div>
              </div>
            ),
          },
          {
            key: "booking",
            label: "Booking",
            render: (_, payment) =>
              payment.booking ? (
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {payment.booking.bookingNumber}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.booking.customer}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-500">No booking</span>
              ),
            mobileHidden: true,
          },
          {
            key: "method",
            label: "Method",
            render: (_, payment) => (
              <div className="flex items-center">
                {getMethodIcon(payment.method)}
                <span className="ml-2 text-sm text-gray-900 capitalize">
                  {payment.method.replace("_", " ")}
                </span>
              </div>
            ),
            mobileHidden: true,
          },
          {
            key: "status",
            label: "Status",
            render: (_, payment) => (
              <div className="flex items-center">
                {getStatusIcon(payment.status)}
                <Badge
                  variant={
                    payment.status === "COMPLETED"
                      ? "success"
                      : payment.status === "PENDING"
                      ? "warning"
                      : payment.status === "FAILED"
                      ? "danger"
                      : "default"
                  }
                  className="ml-2"
                >
                  {payment.status}
                </Badge>
              </div>
            ),
          },
          {
            key: "amount",
            label: "Amount",
            render: (_, payment) => (
              <div className="text-sm text-gray-900">
                {formatCurrency(payment.amount, payment.currency)}
              </div>
            ),
            mobileHidden: true,
          },
          {
            key: "date",
            label: "Date",
            render: (_, payment) => (
              <div className="text-sm text-gray-500">
                {formatDate(payment.createdAt)}
              </div>
            ),
            mobileHidden: true,
          },
        ]}
        data={payments}
        loading={loading}
        emptyMessage="No payments found"
        actions={(payment) => (
          <div className="flex items-center space-x-2">
            <ActionButton
              icon={Edit}
              label=""
              onClick={() => handleEditPayment(payment)}
              variant="secondary"
              size="sm"
              tooltip="Edit payment"
            />
            <ActionButton
              icon={Trash2}
              label=""
              onClick={() => handleDeletePayment(payment)}
              variant="danger"
              size="sm"
              tooltip="Delete payment"
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
      {showEditModal && selectedPayment && (
        <EditPaymentModal
          payment={selectedPayment}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdatePayment}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedPayment && (
        <DeletePaymentModal
          payment={selectedPayment}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeletePaymentConfirm}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePaymentModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false);
            fetchPayments();
          }}
        />
      )}
    </div>
  );
}

// Edit Payment Modal Component
function EditPaymentModal({
  payment,
  onClose,
  onSave,
}: {
  payment: Payment;
  onClose: () => void;
  onSave: (data: Partial<Payment>) => void;
}) {
  const [formData, setFormData] = useState({
    status: payment.status,
    amount: payment.amount.toString(),
    method: payment.method,
    provider: payment.provider,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Edit Payment
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Method
              </label>
              <select
                value={formData.method}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, method: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="CARD">Card</option>
                <option value="PAYPAL">PayPal</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Provider
              </label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, provider: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
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

// Delete Payment Modal Component
function DeletePaymentModal({
  payment,
  onClose,
  onConfirm,
}: {
  payment: Payment;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Delete Payment
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete payment{" "}
            <strong>{payment.transactionId || payment.id}</strong>? This action
            cannot be undone.
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
              Delete Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Payment Modal Component
function CreatePaymentModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    bookingId: "",
    amount: "",
    currency: "USD",
    method: "CARD",
    provider: "stripe",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiClient.post("/api/admin/payments", {
        ...formData,
        amount: parseFloat(formData.amount),
      });

      onSave();
    } catch (error: any) {
      alert(error.message || "Failed to create payment");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Create Payment
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Booking ID
              </label>
              <input
                type="text"
                required
                value={formData.bookingId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bookingId: e.target.value,
                  }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, currency: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="NGN">NGN</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Method
              </label>
              <select
                value={formData.method}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, method: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="CARD">Card</option>
                <option value="PAYPAL">PayPal</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Provider
              </label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, provider: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              />
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
                Create Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
