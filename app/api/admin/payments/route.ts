import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const method = searchParams.get("method");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (method) {
      whereClause.method = method;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (minAmount || maxAmount) {
      whereClause.amount = {};
      if (minAmount) whereClause.amount.gte = parseFloat(minAmount);
      if (maxAmount) whereClause.amount.lte = parseFloat(maxAmount);
    }

    if (search) {
      whereClause.OR = [
        { transactionId: { contains: search, mode: "insensitive" } },
        { booking: { bookingNumber: { contains: search, mode: "insensitive" } } },
        { booking: { user: { email: { contains: search, mode: "insensitive" } } } },
        { booking: { user: { firstName: { contains: search, mode: "insensitive" } } } },
        { booking: { user: { lastName: { contains: search, mode: "insensitive" } } } },
        { booking: { guestName: { contains: search, mode: "insensitive" } } },
        { booking: { guestEmail: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get payments with pagination
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          bookingId: true,
          userId: true,
          amount: true,
          currency: true,
          method: true,
          provider: true,
          transactionId: true,
          status: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              bookingType: true,
              status: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
              guestName: true,
              guestEmail: true,
            },
          },
        },
      }),
      prisma.payment.count({ where: whereClause }),
    ]);

    // Transform payments data
    const transformedPayments = payments.map((payment) => ({
      id: payment.id,
      bookingId: payment.bookingId,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      provider: payment.provider,
      transactionId: payment.transactionId,
      status: payment.status,
      metadata: payment.metadata,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      booking: payment.booking ? {
        id: payment.booking.id,
        bookingNumber: payment.booking.bookingNumber,
        type: payment.booking.bookingType,
        status: payment.booking.status,
        customer: payment.booking.user
          ? `${payment.booking.user.firstName} ${payment.booking.user.lastName}`
          : payment.booking.guestName,
        email: payment.booking.user?.email || payment.booking.guestEmail,
      } : null,
    }));

    // Get payment statistics
    const paymentStats = await prisma.payment.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { amount: true },
    });

    const methodStats = await prisma.payment.groupBy({
      by: ["method"],
      _count: { id: true },
      _sum: { amount: true },
    });

    return NextResponse.json({
      message: "Payments retrieved successfully",
      data: {
        payments: transformedPayments,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        statistics: {
          byStatus: paymentStats.map((stat) => ({
            status: stat.status,
            count: stat._count.id,
            totalAmount: Number(stat._sum.amount) || 0,
          })),
          byMethod: methodStats.map((stat) => ({
            method: stat.method,
            count: stat._count.id,
            totalAmount: Number(stat._sum.amount) || 0,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch payments",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bookingId,
      amount,
      currency = "USD",
      method,
      provider = "stripe",
      metadata,
    } = body;

    // Validate required fields
    if (!bookingId || !amount || !method) {
      return NextResponse.json(
        {
          message: "Booking ID, amount, and method are required",
        },
        { status: 400 }
      );
    }

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
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

    // Generate transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new payment
    const newPayment = await prisma.payment.create({
      data: {
        bookingId,
        transactionId,
        amount: parseFloat(amount),
        currency,
        method,
        provider,
        status: "PENDING",
        metadata: metadata || {},
      },
      include: {
        booking: {
          select: {
            bookingNumber: true,
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            guestName: true,
            guestEmail: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Payment created successfully",
      data: {
        id: newPayment.id,
        transactionId: newPayment.transactionId,
        amount: newPayment.amount,
        currency: newPayment.currency,
        method: newPayment.method,
        provider: newPayment.provider,
        status: newPayment.status,
        createdAt: newPayment.createdAt,
        booking: {
          bookingNumber: newPayment.booking.bookingNumber,
          customer: newPayment.booking.user
            ? `${newPayment.booking.user.firstName} ${newPayment.booking.user.lastName}`
            : newPayment.booking.guestName,
          email: newPayment.booking.user?.email || newPayment.booking.guestEmail,
        },
      },
    });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      {
        message: "Failed to create payment",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paymentId,
      status,
      amount,
      method,
      provider,
      metadata,
    } = body;

    if (!paymentId) {
      return NextResponse.json(
        {
          message: "Payment ID is required",
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (method) updateData.method = method;
    if (provider) updateData.provider = provider;
    if (metadata) updateData.metadata = metadata;

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        booking: {
          select: {
            bookingNumber: true,
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            guestName: true,
            guestEmail: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Payment updated successfully",
      data: {
        id: updatedPayment.id,
        transactionId: updatedPayment.transactionId,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        method: updatedPayment.method,
        provider: updatedPayment.provider,
        status: updatedPayment.status,
        updatedAt: updatedPayment.updatedAt,
        booking: {
          bookingNumber: updatedPayment.booking.bookingNumber,
          customer: updatedPayment.booking.user
            ? `${updatedPayment.booking.user.firstName} ${updatedPayment.booking.user.lastName}`
            : updatedPayment.booking.guestName,
          email: updatedPayment.booking.user?.email || updatedPayment.booking.guestEmail,
        },
      },
    });
  } catch (error: any) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      {
        message: "Failed to update payment",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        {
          message: "Payment ID is required",
        },
        { status: 400 }
      );
    }

    // Check if payment exists and get details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          select: {
            bookingNumber: true,
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            guestName: true,
            guestEmail: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          message: "Payment not found",
        },
        { status: 404 }
      );
    }

    // Check if payment is completed
    if (payment.status === "COMPLETED") {
      return NextResponse.json(
        {
          message: "Cannot delete completed payment. Please refund instead.",
        },
        { status: 400 }
      );
    }

    // Delete the payment
    await prisma.payment.delete({
      where: { id: paymentId },
    });

    return NextResponse.json({
      message: "Payment deleted successfully",
      data: {
        id: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        booking: {
          bookingNumber: payment.booking.bookingNumber,
          customer: payment.booking.user
            ? `${payment.booking.user.firstName} ${payment.booking.user.lastName}`
            : payment.booking.guestName,
          email: payment.booking.user?.email || payment.booking.guestEmail,
        },
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      {
        message: "Failed to delete payment",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
