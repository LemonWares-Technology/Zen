"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
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

interface Booking {
  id: string;
  bookingNumber: string;
  type: string;
  status: string;
  totalAmount: number;
  currency: string;
  customer: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
  };
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    createdAt: string;
  }>;
  amadeusRef?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BookingsPage() {
  const dispatch = useAppDispatch();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    startDate: "",
    endDate: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, filters, searchTerm]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };

      const data = await apiClient.get<{
        data: {
          bookings: Booking[];
          pagination: typeof pagination;
        };
      }>("/api/admin/bookings", params);

      setBookings(data.data.bookings);
      setPagination(data.data.pagination);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch bookings";
      setError(errorMessage);
      dispatch(showError("Failed to load bookings", errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBookings();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  const handleDeleteBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDeleteModal(true);
  };

  const handleUpdateBooking = async (updatedData: Partial<Booking>) => {
    if (!selectedBooking) return;

    try {
      setActionLoading(true);

      await apiClient.patch("/api/admin/bookings", {
        bookingId: selectedBooking.id,
        ...updatedData,
      });

      setShowEditModal(false);
      setSelectedBooking(null);
      dispatch(
        showSuccess(
          "Booking updated successfully",
          "Booking information has been updated"
        )
      );
      fetchBookings();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update booking";
      setError(errorMessage);
      dispatch(showError("Failed to update booking", errorMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBookingConfirm = async () => {
    if (!selectedBooking) return;

    try {
      setActionLoading(true);

      await apiClient.delete("/api/admin/bookings", {
        bookingId: selectedBooking.id,
      });

      setShowDeleteModal(false);
      setSelectedBooking(null);
      dispatch(
        showSuccess("Booking deleted successfully", "Booking has been removed")
      );
      fetchBookings();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete booking";
      setError(errorMessage);
      dispatch(showError("Failed to delete booking", errorMessage));
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
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Booking Management"
        description="Manage and track all customer bookings"
        tooltip="View, edit, and manage all customer bookings in the system"
        actions={
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <ActionButton
              icon={Filter}
              label="Filter"
              onClick={() => {}}
              variant="secondary"
              size="sm"
            />
            <ActionButton
              icon={Calendar}
              label="Export"
              onClick={() => {}}
              variant="secondary"
              size="sm"
            />
          </div>
        }
      />

      {/* Search and Filters */}
      <Card
        title="Search & Filters"
        description="Filter bookings by various criteria"
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <FormField
                label="Search Bookings"
                helpText="Search by booking number, customer name, or email"
              >
                <SearchBar
                  placeholder="Search bookings by number, customer name, or email..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              </FormField>
            </div>
            <div className="flex gap-2">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Types</option>
                <option value="FLIGHT">Flight</option>
                <option value="HOTEL">Hotel</option>
                <option value="CAR">Car</option>
                <option value="TOUR">Tour</option>
                <option value="PACKAGE">Package</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
          <div className="flex gap-4">
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </form>
      </Card>

      {/* Bookings Table */}
      <DataTable
        columns={[
          {
            key: "booking",
            label: "Booking",
            render: (_, booking) => (
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {booking.bookingNumber}
                </div>
                <div className="text-sm text-gray-500">
                  {booking.amadeusRef && `Ref: ${booking.amadeusRef}`}
                </div>
              </div>
            ),
          },
          {
            key: "customer",
            label: "Customer",
            render: (_, booking) => (
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {booking.customer.name}
                </div>
                <div className="text-sm text-gray-500">
                  {booking.customer.email}
                </div>
              </div>
            ),
          },
          {
            key: "type",
            label: "Type",
            render: (_, booking) => (
              <Badge variant="info">{booking.type}</Badge>
            ),
            mobileHidden: true,
          },
          {
            key: "status",
            label: "Status",
            render: (_, booking) => (
              <div className="flex items-center">
                {getStatusIcon(booking.status)}
                <Badge
                  variant={
                    booking.status === "CONFIRMED"
                      ? "success"
                      : booking.status === "PENDING"
                      ? "warning"
                      : booking.status === "CANCELLED"
                      ? "danger"
                      : "default"
                  }
                  className="ml-2"
                >
                  {booking.status}
                </Badge>
              </div>
            ),
          },
          {
            key: "amount",
            label: "Amount",
            render: (_, booking) => (
              <div className="text-sm text-gray-900">
                {formatCurrency(booking.totalAmount, booking.currency)}
              </div>
            ),
            mobileHidden: true,
          },
          {
            key: "date",
            label: "Date",
            render: (_, booking) => (
              <div className="text-sm text-gray-500">
                {formatDate(booking.createdAt)}
              </div>
            ),
            mobileHidden: true,
          },
        ]}
        data={bookings}
        loading={loading}
        emptyMessage="No bookings found"
        actions={(booking) => (
          <div className="flex items-center space-x-2">
            <ActionButton
              icon={Edit}
              label=""
              onClick={() => handleEditBooking(booking)}
              variant="secondary"
              size="sm"
              tooltip="Edit booking"
            />
            <ActionButton
              icon={Trash2}
              label=""
              onClick={() => handleDeleteBooking(booking)}
              variant="danger"
              size="sm"
              tooltip="Delete booking"
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
      {showEditModal && selectedBooking && (
        <EditBookingModal
          booking={selectedBooking}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateBooking}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedBooking && (
        <DeleteBookingModal
          booking={selectedBooking}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteBookingConfirm}
        />
      )}
    </div>
  );
}

// Edit Booking Modal Component
function EditBookingModal({
  booking,
  isOpen,
  onClose,
  onSave,
}: {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Booking>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    status: booking.status,
    guestName: booking.customer.name,
    guestEmail: booking.customer.email,
    guestPhone: booking.customer.phone || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Booking" size="md">
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
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Guest Name
          </label>
          <input
            type="text"
            value={formData.guestName}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                guestName: e.target.value,
              }))
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Guest Email
          </label>
          <input
            type="email"
            value={formData.guestEmail}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                guestEmail: e.target.value,
              }))
            }
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Guest Phone
          </label>
          <input
            type="tel"
            value={formData.guestPhone}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                guestPhone: e.target.value,
              }))
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
    </Modal>
  );
}

// Delete Booking Modal Component
function DeleteBookingModal({
  booking,
  onClose,
  onConfirm,
}: {
  booking: Booking;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Delete Booking
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete booking{" "}
            <strong>{booking.bookingNumber}</strong>? This action cannot be
            undone and will remove all associated data.
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
              Delete Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
