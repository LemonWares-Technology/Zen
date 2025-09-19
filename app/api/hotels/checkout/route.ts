import getAmadeusToken, { baseURL } from "@/lib/functions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      userId,
      guestEmail,
      guestName,
      guestPhone,
      hotelOfferData,
      guestDetails,
      paymentMethod,
      specialRequests,
    } = body;

    // Must have either userId or guest details
    if (!userId && (!guestEmail || !guestName)) {
      return NextResponse.json(
        {
          message: "Either userId or guest details (email, name) are required",
          error: "MISSING_USER_INFO",
        },
        { status: 400 }
      );
    }

    // Validate hotel offer data
    if (
      !hotelOfferData ||
      !hotelOfferData.offers ||
      hotelOfferData.offers.length === 0
    ) {
      return NextResponse.json(
        {
          message: "Valid hotel offer data is required",
          error: "INVALID_HOTEL_OFFER",
        },
        { status: 400 }
      );
    }

    // Validate guest details structure
    if (
      !guestDetails ||
      !guestDetails.guests ||
      guestDetails.guests.length === 0
    ) {
      return NextResponse.json(
        {
          message: "Guest details are required for booking",
          error: "MISSING_GUEST_DETAILS",
        },
        { status: 400 }
      );
    }

    // Get the selected offer (assuming first offer for now)
    const selectedOffer = hotelOfferData.offers[0];
    const totalAmount = parseFloat(selectedOffer.price.total);
    const currency = selectedOffer.price.currency;

    // Generate unique booking number
    const bookingNumber = `HTL${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;

    // Prepare booking data to store
    const bookingData = {
      hotel: hotelOfferData.hotel,
      selectedOffer: selectedOffer,
      guestDetails: guestDetails,
      checkIn: selectedOffer.checkInDate,
      checkOut: selectedOffer.checkOutDate,
      roomQuantity: selectedOffer.roomQuantity || 1,
      specialRequests: specialRequests || null,
      bookingDate: new Date().toISOString(),
      source: "web_booking",
    };

    // Get Amadeus token for booking confirmation
    const token = await getAmadeusToken();

    // Optional: Call Amadeus booking API if you have access to it
    // This would require additional API calls to confirm availability and create booking
    let amadeusBookingRef = null;

    try {
      const amadeusBooKing = await fetch(
        `${baseURL}/v1/booking/hotel-bookings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              offerId: selectedOffer.id,
              guests: guestDetails.guests,
              payments: [
                {
                  method: paymentMethod,
                  // payment details
                },
              ],
            },
          }),
        }
      );

      if (amadeusBooKing.ok) {
        const amadeusResponse = await amadeusBooKing.json();
        amadeusBookingRef = amadeusResponse.data.bookingReference;
      }
    } catch (amadeusError) {
      console.warn("Amadeus booking API call failed:", amadeusError);
      return NextResponse.json(
        { message: `Error: ${amadeusError}` },
        { status: 400 }
      );
    }

    // Create booking in database
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        userId: userId || null,
        guestEmail: guestEmail || null,
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        bookingType: "HOTEL",
        status: "PENDING",
        totalAmount: totalAmount,
        currency: currency,
        bookingData: bookingData,
        amadeusRef: amadeusBookingRef,
      },
    });

    // Create initial payment record
    if (paymentMethod) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          userId: userId || null,
          amount: totalAmount,
          currency: currency,
          method: paymentMethod,
          provider: "pending", // Will be updated when actual payment is processed
          status: "PENDING",
        },
      });
    }

    // Remove from cart if cartItemId provided
    if (body.cartItemId) {
      try {
        await prisma.cartItem.delete({
          where: { id: body.cartItemId },
        });
      } catch (cartError) {
        console.warn("Failed to remove item from cart:", cartError);
        // Don't fail the booking if cart removal fails
      }
    }

    // Prepare response
    const bookingResponse = {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      hotel: {
        name: hotelOfferData.hotel.name,
        address: hotelOfferData.hotel.address,
        contact: hotelOfferData.hotel.contact,
      },
      offer: {
        checkInDate: selectedOffer.checkInDate,
        checkOutDate: selectedOffer.checkOutDate,
        room: selectedOffer.room,
        guests: selectedOffer.guests,
        price: selectedOffer.price,
      },
      totalAmount: totalAmount,
      currency: currency,
      amadeusReference: amadeusBookingRef,
      createdAt: booking.createdAt,
    };

    return NextResponse.json(
      {
        message: "Hotel booking created successfully",
        data: bookingResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(`Error occurred during hotel booking process:`, error);

    return NextResponse.json(
      {
        message: "Internal server error during booking",
        error: "BOOKING_FAILED",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
