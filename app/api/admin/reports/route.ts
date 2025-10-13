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
    const reportType = searchParams.get("type") || "summary";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "json";

    // Default to last 30 days if no dates provided
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = new Date();

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;

    if (reportType === "summary") {
      // Generate summary report
      const [
        bookings,
        revenue,
        users,
        topDestinations,
        bookingTypes,
        paymentMethods,
      ] = await Promise.all([
        // Bookings summary
        prisma.booking.findMany({
          where: {
            createdAt: { gte: start, lte: end },
          },
          include: {
            user: {
              select: { email: true, firstName: true, lastName: true },
            },
            payments: {
              where: { status: "COMPLETED" },
              select: { amount: true, currency: true, method: true },
            },
          },
        }),

        // Revenue summary
        prisma.payment.aggregate({
          where: {
            status: "COMPLETED",
            createdAt: { gte: start, lte: end },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),

        // Users summary
        prisma.user.findMany({
          where: {
            createdAt: { gte: start, lte: end },
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            _count: {
              select: { bookings: true, payments: true },
            },
          },
        }),

        // Top destinations
        prisma.booking.findMany({
          where: {
            createdAt: { gte: start, lte: end },
          },
          select: { bookingData: true },
          take: 1000,
        }),

        // Booking types
        prisma.booking.groupBy({
          by: ["bookingType"],
          where: {
            createdAt: { gte: start, lte: end },
          },
          _count: { id: true },
          _sum: { totalAmount: true },
        }),

        // Payment methods
        prisma.payment.groupBy({
          by: ["method"],
          where: {
            status: "COMPLETED",
            createdAt: { gte: start, lte: end },
          },
          _count: { id: true },
          _sum: { amount: true },
        }),
      ]);

      // Process top destinations
      const destinationCounts: { [key: string]: number } = {};
      topDestinations.forEach((booking) => {
        const data = booking.bookingData as any;
        if (data?.outbound?.segments?.[0]?.arrival?.iataCode) {
          const destination = data.outbound.segments[0].arrival.iataCode;
          destinationCounts[destination] = (destinationCounts[destination] || 0) + 1;
        }
      });

      const topDestinationsList = Object.entries(destinationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([code, count]) => ({ code, count }));

      const reportData = {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
        },
        summary: {
          totalBookings: bookings.length,
          totalRevenue: Number(revenue._sum.amount) || 0,
          totalTransactions: revenue._count.id,
          totalUsers: users.length,
          averageBookingValue: bookings.length > 0 ? (Number(revenue._sum.amount) || 0) / bookings.length : 0,
        },
        breakdown: {
          bookingTypes: bookingTypes.map((type) => ({
            type: type.bookingType,
            count: type._count.id,
            revenue: Number(type._sum.totalAmount) || 0,
            percentage: bookings.length > 0 ? (type._count.id / bookings.length) * 100 : 0,
          })),
          paymentMethods: paymentMethods.map((method) => ({
            method: method.method,
            count: method._count.id,
            amount: Number(method._sum.amount) || 0,
            percentage: revenue._count.id > 0 ? (method._count.id / revenue._count.id) * 100 : 0,
          })),
        },
        topDestinations: topDestinationsList,
        recentBookings: bookings.slice(0, 10).map((booking) => ({
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          type: booking.bookingType,
          status: booking.status,
          amount: booking.totalAmount,
          currency: booking.currency,
          customer: booking.user
            ? `${booking.user.firstName} ${booking.user.lastName}`
            : booking.guestName,
          email: booking.user?.email || booking.guestEmail,
          createdAt: booking.createdAt,
        })),
        newUsers: users.slice(0, 10).map((user) => ({
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          bookings: user._count.bookings,
          payments: user._count.payments,
          createdAt: user.createdAt,
        })),
      };

      return NextResponse.json({
        message: "Summary report generated successfully",
        data: reportData,
      });
    }

    if (reportType === "financial") {
      // Generate financial report
      const [
        payments,
        refunds,
        revenueByDay,
        revenueByType,
      ] = await Promise.all([
        // All payments
        prisma.payment.findMany({
          where: {
            createdAt: { gte: start, lte: end },
          },
          include: {
            booking: {
              select: { bookingType: true, totalAmount: true },
            },
          },
        }),

        // Refunds
        prisma.payment.findMany({
          where: {
            status: "REFUNDED",
            createdAt: { gte: start, lte: end },
          },
        }),

        // Revenue by day
        prisma.payment.groupBy({
          by: ["createdAt"],
          where: {
            status: "COMPLETED",
            createdAt: { gte: start, lte: end },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),

        // Revenue by booking type
        prisma.booking.groupBy({
          by: ["bookingType"],
          where: {
            createdAt: { gte: start, lte: end },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
      ]);

      const totalRevenue = payments
        .filter(p => p.status === "COMPLETED")
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      const totalRefunds = refunds.reduce((sum, p) => sum + Number(p.amount), 0);
      const netRevenue = totalRevenue - totalRefunds;

      const reportData = {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        financial: {
          totalRevenue,
          totalRefunds,
          netRevenue,
          transactionCount: payments.length,
          refundCount: refunds.length,
        },
        dailyRevenue: revenueByDay.map((day) => ({
          date: day.createdAt.toISOString().split("T")[0],
          amount: Number(day._sum.amount) || 0,
          transactions: day._count.id,
        })),
        revenueByType: revenueByType.map((type) => ({
          type: type.bookingType,
          amount: Number(type._sum.totalAmount) || 0,
          bookings: type._count.id,
        })),
        paymentStatus: {
          completed: payments.filter(p => p.status === "COMPLETED").length,
          pending: payments.filter(p => p.status === "PENDING").length,
          failed: payments.filter(p => p.status === "FAILED").length,
          refunded: payments.filter(p => p.status === "REFUNDED").length,
        },
      };

      return NextResponse.json({
        message: "Financial report generated successfully",
        data: reportData,
      });
    }

    if (reportType === "users") {
      // Generate user report
      const [
        users,
        userActivity,
        userSegments,
      ] = await Promise.all([
        // All users
        prisma.user.findMany({
          where: {
            createdAt: { gte: start, lte: end },
          },
          include: {
            _count: {
              select: { bookings: true, payments: true },
            },
          },
        }),

        // User activity
        prisma.user.findMany({
          where: {
            lastLoginAt: { gte: start, lte: end },
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            lastLoginAt: true,
            _count: {
              select: { bookings: true, payments: true },
            },
          },
        }),

        // User segments
        prisma.user.groupBy({
          by: ["role"],
          where: {
            createdAt: { gte: start, lte: end },
          },
          _count: { id: true },
        }),
      ]);

      const reportData = {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        users: {
          totalNewUsers: users.length,
          activeUsers: userActivity.length,
          averageBookingsPerUser: users.length > 0 
            ? users.reduce((sum, user) => sum + user._count.bookings, 0) / users.length 
            : 0,
        },
        segments: userSegments.map((segment) => ({
          role: segment.role,
          count: segment._count.id,
        })),
        topUsers: users
          .sort((a, b) => b._count.bookings - a._count.bookings)
          .slice(0, 10)
          .map((user) => ({
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            bookings: user._count.bookings,
            payments: user._count.payments,
            createdAt: user.createdAt,
          })),
        recentActivity: userActivity
          .sort((a, b) => new Date(b.lastLoginAt!).getTime() - new Date(a.lastLoginAt!).getTime())
          .slice(0, 10)
          .map((user) => ({
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            lastLogin: user.lastLoginAt,
            bookings: user._count.bookings,
            payments: user._count.payments,
          })),
      };

      return NextResponse.json({
        message: "User report generated successfully",
        data: reportData,
      });
    }

    return NextResponse.json(
      {
        message: "Invalid report type",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      {
        message: "Failed to generate report",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
