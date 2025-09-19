import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingNumber = searchParams.get("bookingNumber");
    const bookingId = searchParams.get("bookingId");
    const userId = searchParams.get("userId");
    const guestEmail = searchParams.get("guestEmail");

    if (!bookingNumber && !bookingId) {
      return NextResponse.json(
        { message: "Either bookingNumber or bookingId is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause: any = {};

    if (bookingNumber) {
      whereClause.bookingNumber = bookingNumber;
    } else if (bookingId) {
      whereClause.id = bookingId;
    }

    // Add user/guest verification
    if (userId) {
      whereClause.userId = userId;
    } else if (guestEmail) {
      whereClause.guestEmail = guestEmail;
    }

    const booking = await prisma.booking.findFirst({
      where: whereClause,
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Booking retrieved successfully",
        data: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          bookingType: booking.bookingType,
          totalAmount: booking.totalAmount,
          currency: booking.currency,
          bookingData: booking.bookingData,
          amadeusRef: booking.amadeusRef,
          payments: booking.payments.map((payment: any) => ({
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            status: payment.status,
            createdAt: payment.createdAt,
          })),
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error retrieving booking:`, error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}