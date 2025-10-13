import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, createAuthErrorResponse } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminToken(request);
    if (!authResult.isValid) {
      return createAuthErrorResponse(
        authResult.error || "Authentication failed"
      );
    }
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.bookingType = type;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (search) {
      whereClause.OR = [
        { bookingNumber: { contains: search, mode: "insensitive" } },
        { guestName: { contains: search, mode: "insensitive" } },
        { guestEmail: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              currency: true,
              method: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.booking.count({ where: whereClause }),
    ]);

    // Transform bookings data
    const transformedBookings = bookings.map((booking) => ({
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      type: booking.bookingType,
      status: booking.status,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      customer: {
        id: booking.user?.id,
        name: booking.user
          ? `${booking.user.firstName} ${booking.user.lastName}`
          : booking.guestName,
        email: booking.user?.email || booking.guestEmail,
        phone: booking.user?.phone || booking.guestPhone,
      },
      payments: booking.payments,
      amadeusRef: booking.amadeusRef,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));

    return NextResponse.json({
      message: "Bookings retrieved successfully",
      data: {
        bookings: transformedBookings,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch bookings",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminToken(request);
    if (!authResult.isValid) {
      return createAuthErrorResponse(
        authResult.error || "Authentication failed"
      );
    }
    const body = await request.json();
    const { bookingId, status, guestName, guestEmail, guestPhone } = body;

    if (!bookingId) {
      return NextResponse.json(
        {
          message: "Booking ID is required",
        },
        { status: 400 }
      );
    }

    // Build update data - only allow status and guest info changes
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (guestName) updateData.guestName = guestName;
    if (guestEmail) updateData.guestEmail = guestEmail;
    if (guestPhone) updateData.guestPhone = guestPhone;

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        payments: true,
      },
    });

    return NextResponse.json({
      message: "Booking updated successfully",
      data: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        customer: updatedBooking.user
          ? `${updatedBooking.user.firstName} ${updatedBooking.user.lastName}`
          : updatedBooking.guestName,
        email: updatedBooking.user?.email || updatedBooking.guestEmail,
        guestName: updatedBooking.guestName,
        guestEmail: updatedBooking.guestEmail,
        guestPhone: updatedBooking.guestPhone,
        updatedAt: updatedBooking.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      {
        message: "Failed to update booking",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminToken(request);
    if (!authResult.isValid) {
      return createAuthErrorResponse(
        authResult.error || "Authentication failed"
      );
    }
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        {
          message: "Booking ID is required",
        },
        { status: 400 }
      );
    }

    // Check if booking has payments
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          message: "Booking not found",
        },
        { status: 404 }
      );
    }

    // Check if booking has completed payments
    const hasCompletedPayments = booking.payments.some(
      (payment) => payment.status === "COMPLETED"
    );

    if (hasCompletedPayments) {
      return NextResponse.json(
        {
          message:
            "Cannot delete booking with completed payments. Please cancel instead.",
        },
        { status: 400 }
      );
    }

    // Delete associated payments first
    await prisma.payment.deleteMany({
      where: { bookingId: bookingId },
    });

    // Delete the booking
    await prisma.booking.delete({
      where: { id: bookingId },
    });

    return NextResponse.json({
      message: "Booking deleted successfully",
      data: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customer: booking.user
          ? `${booking.user.firstName} ${booking.user.lastName}`
          : booking.guestName,
        email: booking.user?.email || booking.guestEmail,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      {
        message: "Failed to delete booking",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
