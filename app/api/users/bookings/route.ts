import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET - Fetch user's booking history
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, confirmed, completed, cancelled
    const bookingType = searchParams.get("type"); // flight, hotel, car, tour, package
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build filter conditions
    const where: any = {
      userId: decoded.userId,
    };

    if (status) {
      where.status = status;
    }

    if (bookingType) {
      where.bookingType = bookingType;
    }

    // Fetch bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          bookingNumber: true,
          bookingType: true,
          status: true,
          totalAmount: true,
          currency: true,
          bookingData: true,
          amadeusRef: true,
          createdAt: true,
          updatedAt: true,
          payments: {
            select: {
              id: true,
              amount: true,
              currency: true,
              method: true,
              provider: true,
              status: true,
              createdAt: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json(
      {
        bookings,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
