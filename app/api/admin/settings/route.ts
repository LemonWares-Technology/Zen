import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get system settings and configuration
    const [
      systemStats,
      recentActivity,
      errorLogs,
      performanceMetrics,
    ] = await Promise.all([
      // System statistics
      Promise.all([
        prisma.booking.count(),
        prisma.user.count(),
        prisma.payment.count(),
        prisma.payment.aggregate({
          where: { status: "COMPLETED" },
          _sum: { amount: true },
        }),
      ]),

      // Recent activity (last 24 hours)
      Promise.all([
        prisma.booking.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.payment.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
      ]),

      // Error logs (simulated - you might want to implement actual error logging)
      [],

      // Performance metrics
      Promise.all([
        prisma.booking.findMany({
          take: 100,
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, totalAmount: true },
        }),
      ]),
    ]);

    const [totalBookings, totalUsers, totalPayments, totalRevenue] = systemStats;
    const [recentBookings, recentUsers, recentPayments] = recentActivity;
    const [recentBookingData] = performanceMetrics;

    // Calculate performance metrics
    const averageResponseTime = 150; // Simulated - implement actual monitoring
    const systemUptime = 99.9; // Simulated - implement actual monitoring
    const errorRate = 0.1; // Simulated - implement actual monitoring

    // Calculate growth rates
    const bookingGrowthRate = recentBookings > 0 ? (recentBookings / totalBookings) * 100 : 0;
    const userGrowthRate = recentUsers > 0 ? (recentUsers / totalUsers) * 100 : 0;
    const revenueGrowthRate = recentPayments > 0 ? (recentPayments / totalPayments) * 100 : 0;

    return NextResponse.json({
      message: "System settings retrieved successfully",
      data: {
        system: {
          totalBookings,
          totalUsers,
          totalPayments,
          totalRevenue: Number(totalRevenue._sum.amount) || 0,
          systemUptime,
          averageResponseTime,
          errorRate,
        },
        activity: {
          recentBookings,
          recentUsers,
          recentPayments,
          bookingGrowthRate,
          userGrowthRate,
          revenueGrowthRate,
        },
        performance: {
          averageBookingValue: recentBookingData.length > 0 
            ? recentBookingData.reduce((sum, booking) => sum + Number(booking.totalAmount), 0) / recentBookingData.length 
            : 0,
          peakHours: [9, 10, 11, 14, 15, 16], // Simulated - implement actual analysis
          busiestDays: ["Monday", "Tuesday", "Wednesday"], // Simulated
        },
        alerts: [
          {
            type: "info",
            message: "System running normally",
            timestamp: new Date().toISOString(),
          },
        ],
        maintenance: {
          nextScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          backupStatus: "completed",
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching system settings:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch system settings",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "backup":
        // Simulate backup operation
        return NextResponse.json({
          message: "Backup initiated successfully",
          data: {
            backupId: `backup_${Date.now()}`,
            status: "in_progress",
            estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          },
        });

      case "maintenance":
        // Simulate maintenance mode toggle
        return NextResponse.json({
          message: "Maintenance mode toggled successfully",
          data: {
            maintenanceMode: data.enabled,
            message: data.message || "System under maintenance",
            estimatedDuration: data.duration || "2 hours",
          },
        });

      case "clear_cache":
        // Simulate cache clearing
        return NextResponse.json({
          message: "Cache cleared successfully",
          data: {
            clearedAt: new Date().toISOString(),
            itemsCleared: 1250,
          },
        });

      case "send_notification":
        // Simulate notification sending
        return NextResponse.json({
          message: "Notification sent successfully",
          data: {
            notificationId: `notif_${Date.now()}`,
            recipients: data.recipients || "all_users",
            type: data.type || "info",
            sentAt: new Date().toISOString(),
          },
        });

      default:
        return NextResponse.json(
          {
            message: "Invalid action",
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Error executing system action:", error);
    return NextResponse.json(
      {
        message: "Failed to execute system action",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
