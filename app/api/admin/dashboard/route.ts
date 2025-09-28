import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get dashboard statistics
    const [
      totalBookings,
      totalUsers,
      totalRevenue,
      recentBookings,
      bookingStats,
      revenueStats,
    ] = await Promise.all([
      // Total bookings count
      prisma.booking.count(),
      
      // Total users count
      prisma.user.count(),
      
      // Total revenue
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      
      // Recent bookings (last 10)
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          payments: {
            where: { status: "COMPLETED" },
            select: { amount: true, currency: true },
          },
        },
      }),
      
      // Booking statistics by type
      prisma.booking.groupBy({
        by: ["bookingType"],
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      
      // Revenue by month (last 6 months)
      prisma.payment.groupBy({
        by: ["createdAt"],
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 months ago
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // Calculate conversion rates and other metrics
    const totalRevenueAmount = Number(totalRevenue._sum.amount) || 0;
    const averageBookingValue = totalBookings > 0 ? totalRevenueAmount / totalBookings : 0;

    // Get booking status distribution
    const statusDistribution = await prisma.booking.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Get top destinations (from booking data)
    const topDestinations = await prisma.booking.findMany({
      select: { bookingData: true },
      take: 100,
    });

    // Process top destinations from booking data
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
      message: "Dashboard data retrieved successfully",
      data: {
        overview: {
          totalBookings,
          totalUsers,
          totalRevenue: totalRevenueAmount,
          averageBookingValue,
        },
        recentBookings: recentBookings.map((booking) => ({
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
        bookingStats: bookingStats.map((stat) => ({
          type: stat.bookingType,
          count: stat._count.id,
          revenue: stat._sum.totalAmount || 0,
        })),
        statusDistribution: statusDistribution.map((stat) => ({
          status: stat.status,
          count: stat._count.id,
        })),
        topDestinations: topDestinationsList,
        revenueStats: revenueStats.map((stat) => ({
          month: stat.createdAt.toISOString().slice(0, 7), // YYYY-MM format
          revenue: stat._sum.amount || 0,
          bookings: stat._count.id,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch dashboard data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
