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
    const period = searchParams.get("period") || "30"; // days
    const type = searchParams.get("type") || "overview";

    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    if (type === "overview") {
      // Get overview analytics
      const [
        totalBookings,
        totalRevenue,
        totalUsers,
        bookingTrends,
        revenueTrends,
        topDestinations,
        bookingTypes,
        paymentMethods,
      ] = await Promise.all([
        // Total bookings in period
        prisma.booking.count({
          where: { createdAt: { gte: startDate } },
        }),

        // Total revenue in period
        prisma.payment.aggregate({
          where: {
            status: "COMPLETED",
            createdAt: { gte: startDate },
          },
          _sum: { amount: true },
        }),

        // Total users in period
        prisma.user.count({
          where: { createdAt: { gte: startDate } },
        }),

        // Booking trends by day
        prisma.booking.groupBy({
          by: ["createdAt"],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
          _sum: { totalAmount: true },
        }),

        // Revenue trends by day
        prisma.payment.groupBy({
          by: ["createdAt"],
          where: {
            status: "COMPLETED",
            createdAt: { gte: startDate },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),

        // Top destinations
        prisma.booking.findMany({
          where: { createdAt: { gte: startDate } },
          select: { bookingData: true },
          take: 1000,
        }),

        // Booking types distribution
        prisma.booking.groupBy({
          by: ["bookingType"],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
          _sum: { totalAmount: true },
        }),

        // Payment methods distribution
        prisma.payment.groupBy({
          by: ["method"],
          where: {
            status: "COMPLETED",
            createdAt: { gte: startDate },
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

      return NextResponse.json({
        message: "Analytics data retrieved successfully",
        data: {
          overview: {
            totalBookings,
            totalRevenue: Number(totalRevenue._sum.amount) || 0,
            totalUsers,
            averageBookingValue: totalBookings > 0 ? (Number(totalRevenue._sum.amount) || 0) / totalBookings : 0,
          },
          trends: {
            bookings: bookingTrends.map((trend) => ({
              date: trend.createdAt.toISOString().split("T")[0],
              count: trend._count.id,
              revenue: Number(trend._sum.totalAmount) || 0,
            })),
            revenue: revenueTrends.map((trend) => ({
              date: trend.createdAt.toISOString().split("T")[0],
              amount: Number(trend._sum.amount) || 0,
              transactions: trend._count.id,
            })),
          },
          distributions: {
            bookingTypes: bookingTypes.map((type) => ({
              type: type.bookingType,
              count: type._count.id,
              revenue: Number(type._sum.totalAmount) || 0,
            })),
            paymentMethods: paymentMethods.map((method) => ({
              method: method.method,
              count: method._count.id,
              amount: Number(method._sum.amount) || 0,
            })),
          },
          topDestinations: topDestinationsList,
        },
      });
    }

    if (type === "revenue") {
      // Get detailed revenue analytics
      const [
        dailyRevenue,
        monthlyRevenue,
        revenueByType,
        revenueByStatus,
      ] = await Promise.all([
        // Daily revenue
        prisma.payment.groupBy({
          by: ["createdAt"],
          where: {
            status: "COMPLETED",
            createdAt: { gte: startDate },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),

        // Monthly revenue
        prisma.payment.groupBy({
          by: ["createdAt"],
          where: {
            status: "COMPLETED",
            createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),

        // Revenue by booking type
        prisma.booking.groupBy({
          by: ["bookingType"],
          where: { createdAt: { gte: startDate } },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),

        // Revenue by payment status
        prisma.payment.groupBy({
          by: ["status"],
          where: { createdAt: { gte: startDate } },
          _sum: { amount: true },
          _count: { id: true },
        }),
      ]);

      return NextResponse.json({
        message: "Revenue analytics retrieved successfully",
        data: {
          dailyRevenue: dailyRevenue.map((revenue) => ({
            date: revenue.createdAt.toISOString().split("T")[0],
            amount: Number(revenue._sum.amount) || 0,
            transactions: revenue._count.id,
          })),
          monthlyRevenue: monthlyRevenue.map((revenue) => ({
            month: revenue.createdAt.toISOString().slice(0, 7),
            amount: Number(revenue._sum.amount) || 0,
            transactions: revenue._count.id,
          })),
          byType: revenueByType.map((type) => ({
            type: type.bookingType,
            amount: Number(type._sum.totalAmount) || 0,
            bookings: type._count.id,
          })),
          byStatus: revenueByStatus.map((status) => ({
            status: status.status,
            amount: Number(status._sum.amount) || 0,
            transactions: status._count.id,
          })),
        },
      });
    }

    if (type === "users") {
      // Get user analytics
      const [
        userGrowth,
        userActivity,
        userSegments,
      ] = await Promise.all([
        // User growth over time
        prisma.user.groupBy({
          by: ["createdAt"],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
        }),

        // User activity (users with bookings)
        prisma.user.findMany({
          where: { createdAt: { gte: startDate } },
          select: {
            id: true,
            createdAt: true,
            lastLoginAt: true,
            _count: {
              select: {
                bookings: true,
                payments: true,
              },
            },
          },
        }),

        // User segments
        prisma.user.groupBy({
          by: ["role"],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
        }),
      ]);

      // Calculate user activity metrics
      const activeUsers = userActivity.filter(user => user.lastLoginAt && 
        new Date(user.lastLoginAt) > startDate).length;
      const usersWithBookings = userActivity.filter(user => user._count.bookings > 0).length;

      return NextResponse.json({
        message: "User analytics retrieved successfully",
        data: {
          growth: userGrowth.map((growth) => ({
            date: growth.createdAt.toISOString().split("T")[0],
            newUsers: growth._count.id,
          })),
          activity: {
            totalUsers: userActivity.length,
            activeUsers,
            usersWithBookings,
            conversionRate: userActivity.length > 0 ? (usersWithBookings / userActivity.length) * 100 : 0,
          },
          segments: userSegments.map((segment) => ({
            role: segment.role,
            count: segment._count.id,
          })),
        },
      });
    }

    return NextResponse.json(
      {
        message: "Invalid analytics type",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch analytics",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

