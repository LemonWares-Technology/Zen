import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET - Get user statistics
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Get booking statistics
    const [
      totalBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalSpent,
      bookingsByType,
    ] = await Promise.all([
      // Total bookings count
      prisma.booking.count({
        where: { userId: decoded.userId },
      }),

      // Confirmed bookings
      prisma.booking.count({
        where: {
          userId: decoded.userId,
          status: "CONFIRMED",
        },
      }),

      // Completed bookings
      prisma.booking.count({
        where: {
          userId: decoded.userId,
          status: "COMPLETED",
        },
      }),

      // Cancelled bookings
      prisma.booking.count({
        where: {
          userId: decoded.userId,
          status: "CANCELLED",
        },
      }),

      // Total amount spent
      prisma.booking.aggregate({
        where: {
          userId: decoded.userId,
          status: {
            in: ["CONFIRMED", "COMPLETED"],
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Bookings by type
      prisma.booking.groupBy({
        by: ["bookingType"],
        where: { userId: decoded.userId },
        _count: true,
      }),
    ]);

    // Calculate unique countries visited (from booking data)
    const bookings = await prisma.booking.findMany({
      where: {
        userId: decoded.userId,
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
      },
      select: {
        bookingData: true,
      },
    });

    // Extract unique countries from booking data
    const countriesSet = new Set<string>();
    bookings.forEach((booking: any) => {
      const data = booking.bookingData;
      if (data.destination?.country) {
        countriesSet.add(data.destination.country);
      }
      if (data.origin?.country) {
        countriesSet.add(data.origin.country);
      }
      if (data.hotel?.country) {
        countriesSet.add(data.hotel.country);
      }
      if (data.country) {
        countriesSet.add(data.country);
      }
    });

    const stats = {
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        byType: bookingsByType.reduce((acc: any, item: any) => {
          acc[item.bookingType.toLowerCase()] = item._count;
          return acc;
        }, {}),
      },
      spending: {
        total: Number(totalSpent._sum.totalAmount || 0),
        currency: "NGN",
      },
      countries: {
        total: countriesSet.size,
        visited: Array.from(countriesSet),
      },
      // Calculate points (example: 1 point per NGN 100 spent)
      points: Math.floor(Number(totalSpent._sum.totalAmount || 0) / 100),
    };

    return NextResponse.json(
      {
        message: "Statistics fetched successfully",
        stats,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching user statistics:", error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
