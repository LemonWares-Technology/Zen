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
      transferOfferData,
      passengerDetails,
      paymentMethod,
      specialRequests,
      note,
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

    // Validate transfer offer data
    if (
      !transferOfferData ||
      !transferOfferData.id ||
      !transferOfferData.vehicle ||
      !transferOfferData.price
    ) {
      return NextResponse.json(
        {
          message: "Valid transfer offer data is required",
          error: "INVALID_TRANSFER_OFFER",
        },
        { status: 400 }
      );
    }

    // Validate passenger details
    if (
      !passengerDetails ||
      !passengerDetails.firstName ||
      !passengerDetails.lastName ||
      !passengerDetails.contacts
    ) {
      return NextResponse.json(
        {
          message: "Passenger details are required for booking",
          error: "MISSING_PASSENGER_DETAILS",
        },
        { status: 400 }
      );
    }

    // Get the selected offer
    const selectedOffer = transferOfferData;
    const totalAmount = parseFloat(selectedOffer.price.total);
    const currency = selectedOffer.price.currency;

    // Generate unique booking number
    const bookingNumber = `CAR${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;

    // Prepare booking data to store
    const bookingData = {
      transferOffer: selectedOffer,
      passengerDetails: passengerDetails,
      pickup: selectedOffer.pickup,
      dropoff: selectedOffer.dropoff,
      vehicle: selectedOffer.vehicle,
      provider: selectedOffer.provider,
      specialRequests: specialRequests || null,
      note: note || null,
      bookingDate: new Date().toISOString(),
      totalAmount: totalAmount,
      currency: currency,
    };

    // Get Amadeus token for booking confirmation
    const token = await getAmadeusToken();

    // Call Amadeus transfer booking API
    let amadeusBookingRef = null;
    let amadeusBookingData = null;

    try {
      const amadeusBooking = await fetch(
        `${baseURL}/v1/ordering/transfer-orders?offerId=${selectedOffer.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              note: note || "Please meet at the pickup location",
              passengers: [passengerDetails],
              billingAddress: {
                line: passengerDetails.contacts.address || "N/A",
                zip: passengerDetails.contacts.zipCode || "N/A",
                countryCode: passengerDetails.contacts.countryCode || "US",
                cityName: passengerDetails.contacts.city || "N/A",
              },
              payment: {
                methodOfPayment: paymentMethod || "CREDIT_CARD",
                // Note: In production, handle payment securely
                creditCard: {
                  number: "4111111111111111", // Test card
                  holderName: `${passengerDetails.firstName} ${passengerDetails.lastName}`.toUpperCase(),
                  vendorCode: "VI",
                  expiryDate: "1225",
                  cvv: "123",
                },
              },
            },
          }),
        }
      );

      if (amadeusBooking.ok) {
        amadeusBookingData = await amadeusBooking.json();
        amadeusBookingRef = amadeusBookingData.data?.id || amadeusBookingData.id;
        console.log("Amadeus booking successful:", amadeusBookingRef);
      } else {
        const errorText = await amadeusBooking.text();
        console.error("Amadeus booking failed:", errorText);
        return NextResponse.json(
          {
            message: "Transfer booking failed with provider",
            error: "AMADEUS_BOOKING_ERROR",
            details: errorText,
          },
          { status: amadeusBooking.status }
        );
      }
    } catch (amadeusError) {
      console.error("Amadeus booking API call failed:", amadeusError);
      return NextResponse.json(
        {
          message: `Transfer booking error: ${amadeusError}`,
          error: "AMADEUS_API_ERROR",
        },
        { status: 500 }
      );
    }

    // Create booking in database
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: bookingNumber,
        bookingType: "CAR",
        userId: userId || null,
        guestEmail: guestEmail || null,
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        status: "CONFIRMED",
        totalAmount: totalAmount,
        currency: currency,
        bookingData: bookingData,
        amadeusRef: amadeusBookingRef,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: totalAmount,
        currency: currency,
        method: paymentMethod === "CREDIT_CARD" ? "CARD" : "CARD",
        provider: "AMADEUS",
        status: "COMPLETED",
        metadata: {
          method: paymentMethod || "CREDIT_CARD",
          // In production, store encrypted payment data
        },
      },
    });

    return NextResponse.json(
      {
        message: "Car transfer booking completed successfully",
        booking: {
          bookingNumber: booking.bookingNumber,
          bookingId: booking.id,
          status: booking.status,
          totalAmount: booking.totalAmount,
          currency: booking.currency,
          transferDetails: {
            vehicle: selectedOffer.vehicle,
            provider: selectedOffer.provider,
            pickup: selectedOffer.pickup,
            dropoff: selectedOffer.dropoff,
            passenger: passengerDetails,
          },
          amadeusBookingRef: amadeusBookingRef,
          bookingDate: booking.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in car booking:", error);

    return NextResponse.json(
      {
        message: `Internal server error: ${error.message || error}`,
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}