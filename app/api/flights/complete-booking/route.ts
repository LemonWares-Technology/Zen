// /app/api/booking/flight/route.ts
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import getAmadeusToken, { baseURL } from "@/lib/functions";

const prisma = new PrismaClient();

// Helper function to fetch airport details from Amadeus API
async function fetchAirportDetails(iataCode: string, token: string) {
  try {
    const response = await fetch(
      `${baseURL}/v1/reference-data/locations?keyword=${iataCode}&subType=AIRPORT`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const airport = data.data?.find((loc: any) => loc.iataCode === iataCode);

      if (airport) {
        return {
          name: airport.name,
          city: airport.address?.cityName,
          country: airport.address?.countryName,
          countryCode: airport.address?.countryCode,
          timeZone: airport.timeZoneOffset,
        };
      }
    }
  } catch (error) {
    console.error(`Error fetching airport details for ${iataCode}:`, error);
  }

  // Fallback to basic info if API fails
  return {
    name: `${iataCode} Airport`,
    city: `${iataCode} City`,
    country: "Unknown",
    countryCode: "XX",
  };
}

// Helper function to fetch airline details from Amadeus API
async function fetchAirlineDetails(airlineCode: string, token: string) {
  try {
    const response = await fetch(
      `${baseURL}/v1/reference-data/airlines?airlineCodes=${airlineCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const airline = data.data?.find((a: any) => a.iataCode === airlineCode);

      if (airline) {
        return {
          name: airline.businessName || airline.commonName,
          iataCode: airline.iataCode,
          icaoCode: airline.icaoCode,
        };
      }
    }
  } catch (error) {
    console.error(`Error fetching airline details for ${airlineCode}:`, error);
  }

  // Fallback if API fails
  return {
    name: `${airlineCode} Airlines`,
    iataCode: airlineCode,
  };
}

// Helper function to enrich flight segments
async function enrichFlightSegments(segments: any[], token: string) {
  const enrichedSegments = [];

  for (const segment of segments) {
    const [departureDetails, arrivalDetails, airlineDetails] =
      await Promise.all([
        fetchAirportDetails(segment.departure.iataCode, token),
        fetchAirportDetails(segment.arrival.iataCode, token),
        fetchAirlineDetails(segment.carrierCode, token),
      ]);

    const enrichedSegment = {
      ...segment,
      departure: {
        ...segment.departure,
        airportName: departureDetails.name,
        cityName: departureDetails.city,
        countryName: departureDetails.country,
        countryCode: departureDetails.countryCode,
        timeZone: departureDetails.timeZone,
      },
      arrival: {
        ...segment.arrival,
        airportName: arrivalDetails.name,
        cityName: arrivalDetails.city,
        countryName: arrivalDetails.country,
        countryCode: arrivalDetails.countryCode,
        timeZone: arrivalDetails.timeZone,
      },
      airline: {
        code: segment.carrierCode,
        name: airlineDetails.name,
        iataCode: airlineDetails.iataCode,
        icaoCode: airlineDetails.icaoCode,
      },
      flightNumber: `${segment.carrierCode}${segment.number}`,
      durationFormatted: formatDuration(segment.duration),
    };

    enrichedSegments.push(enrichedSegment);
  }

  return enrichedSegments;
}

// Helper function to format duration
function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (match) {
    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }
  return duration;
}

// Helper function to enrich the entire booking response
async function enrichBookingData(bookingData: any, token: string) {
  const enrichedBooking = { ...bookingData };

  if (enrichedBooking.data?.flightOffers) {
    for (let i = 0; i < enrichedBooking.data.flightOffers.length; i++) {
      const flightOffer = enrichedBooking.data.flightOffers[i];

      if (flightOffer.itineraries) {
        for (let j = 0; j < flightOffer.itineraries.length; j++) {
          const itinerary = flightOffer.itineraries[j];
          if (itinerary.segments) {
            itinerary.segments = await enrichFlightSegments(
              itinerary.segments,
              token
            );

            const firstSegment = itinerary.segments[0];
            const lastSegment =
              itinerary.segments[itinerary.segments.length - 1];

            itinerary.summary = {
              origin: {
                iataCode: firstSegment.departure.iataCode,
                cityName: firstSegment.departure.cityName,
                countryName: firstSegment.departure.countryName,
              },
              destination: {
                iataCode: lastSegment.arrival.iataCode,
                cityName: lastSegment.arrival.cityName,
                countryName: lastSegment.arrival.countryName,
              },
              totalDuration: calculateTotalDuration(itinerary.segments),
              totalStops: itinerary.segments.length - 1,
              airlines: [
                ...new Set(itinerary.segments.map((s: any) => s.airline.name)),
              ],
            };
          }
        }
      }

      flightOffer.summary = {
        tripType:
          flightOffer.itineraries?.length === 1 ? "One Way" : "Round Trip",
        totalPrice: flightOffer.price?.total,
        currency: flightOffer.price?.currency,
        cabinClass:
          flightOffer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ||
          "ECONOMY",
        validatingAirline: await fetchAirlineDetails(
          flightOffer.validatingAirlineCodes?.[0] || "",
          token
        ),
      };
    }
  }

  if (enrichedBooking.data?.travelers) {
    enrichedBooking.data.travelers = enrichedBooking.data.travelers.map(
      (traveler: any) => ({
        ...traveler,
        fullName: `${traveler.name?.firstName || ""} ${
          traveler.name?.lastName || ""
        }`.trim(),
        age: calculateAge(traveler.dateOfBirth),
        contactSummary: {
          email: traveler.contact?.emailAddress,
          phone: traveler.contact?.phones?.[0]
            ? `+${traveler.contact.phones[0].countryCallingCode} ${traveler.contact.phones[0].number}`
            : null,
        },
      })
    );
  }

  const associatedRecord = enrichedBooking.data?.associatedRecords?.[0];
  enrichedBooking.metadata = {
    bookingReference: associatedRecord?.reference,
    creationDate: associatedRecord?.creationDate,
    lastTicketingDate:
      enrichedBooking.data?.flightOffers?.[0]?.lastTicketingDate,
    totalPassengers: enrichedBooking.data?.travelers?.length || 0,
    status: "CONFIRMED",
  };

  return enrichedBooking;
}

// Helper function to calculate total duration
function calculateTotalDuration(segments: any[]): string {
  if (!segments?.length) return "0m";

  const firstDeparture = new Date(segments[0].departure.at);
  const lastArrival = new Date(segments[segments.length - 1].arrival.at);
  const diffMs = lastArrival.getTime() - firstDeparture.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

// Helper function to calculate age
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      guestEmail,
      guestName,
      guestPhone,
      selectedFlightOffer,
      travelers,
      contacts,
      payments,
      cartItemId,
    } = body;

    // Validate required fields
    if (!selectedFlightOffer || !travelers || !contacts) {
      return NextResponse.json(
        {
          message:
            "Missing required parameters: selectedFlightOffer, travelers, contacts",
          error: "MISSING_FLIGHT_DATA",
        },
        { status: 400 }
      );
    }

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

    // Get total amount from flight offer
    const totalAmount = parseFloat(selectedFlightOffer.price?.total || "0");
    const currency = selectedFlightOffer.price?.currency || "USD";

    // Generate unique booking number
    const bookingNumber = `FLT${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;

    const token = await getAmadeusToken();

    // Step 1: Validate price with Flight Offers Pricing API
    const pricingPayload = {
      data: {
        type: "flight-offers-pricing",
        flightOffers: [selectedFlightOffer],
      },
    };

    const pricingResponse = await fetch(
      `${baseURL}/v1/shopping/flight-offers/pricing`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pricingPayload),
      }
    );

    if (!pricingResponse.ok) {
      const text = await pricingResponse.text();
      return NextResponse.json(
        {
          message: "Flight pricing validation failed",
          error: "PRICING_ERROR",
          details: text,
        },
        { status: pricingResponse.status }
      );
    }

    const pricingData = await pricingResponse.json();

    // Step 2: Extract validated flight offers from pricing response
    let validatedFlightOffers;

    if (pricingData.data && Array.isArray(pricingData.data)) {
      validatedFlightOffers = pricingData.data;
    } else if (pricingData.data && pricingData.data.flightOffers) {
      validatedFlightOffers = pricingData.data.flightOffers;
    } else if (pricingData.data) {
      validatedFlightOffers = [pricingData.data];
    } else {
      return NextResponse.json(
        {
          message: "Invalid pricing response structure",
          error: "INVALID_PRICING_RESPONSE",
        },
        { status: 500 }
      );
    }

    // Step 3: Create booking with Flight Orders API
    const bookingPayload: any = {
      data: {
        type: "flight-order",
        flightOffers: validatedFlightOffers,
        travelers: travelers,
        contacts: contacts,
      },
    };

    if (payments && payments.length > 0) {
      bookingPayload.data.payments = payments;
    }

    const bookingResponse = await fetch(`${baseURL}/v1/booking/flight-orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingPayload),
    });

    if (!bookingResponse.ok) {
      const text = await bookingResponse.text();
      return NextResponse.json(
        {
          message: "Amadeus flight booking failed",
          error: "AMADEUS_BOOKING_ERROR",
          details: text,
        },
        { status: bookingResponse.status }
      );
    }

    const amadeusBookingData = await bookingResponse.json();

    // Step 4: Enrich the booking data with real Amadeus API data
    console.log("Enriching booking data with Amadeus APIs...");
    let enrichedBooking;

    try {
      enrichedBooking = await enrichBookingData(amadeusBookingData, token);
    } catch (enrichmentError) {
      console.error("Error during data enrichment:", enrichmentError);
      enrichedBooking = amadeusBookingData; // Use original data if enrichment fails
    }

    // Step 5: Save to database with enriched Amadeus data
    const bookingData = {
      amadeusBooking: enrichedBooking, // Complete enriched Amadeus response
      originalFlightOffer: selectedFlightOffer, // Original selected offer
      travelers: travelers,
      contacts: contacts,
      payments: payments || [],
      bookingDate: new Date().toISOString(),
      source: "web_booking",
    };

    // Extract Amadeus booking reference
    const amadeusRef =
      enrichedBooking?.data?.associatedRecords?.[0]?.reference ||
      enrichedBooking?.metadata?.bookingReference ||
      null;

    // Create booking in database
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        userId: userId || null,
        guestEmail: guestEmail || null,
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        bookingType: "FLIGHT",
        status: "CONFIRMED", // Amadeus booking successful means confirmed
        totalAmount: totalAmount,
        currency: currency,
        bookingData: bookingData, // All flight data stored here
        amadeusRef: amadeusRef,
        cartItemId: cartItemId || null,
      },
    });

    // Create initial payment record if payment info provided
    if (payments && payments.length > 0) {
      for (const payment of payments) {
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            userId: userId || null,
            amount: totalAmount,
            currency: currency,
            method: payment.method || "CARD",
            provider: "amadeus", // Since payment went through Amadeus
            transactionId: payment.id || null,
            status: "COMPLETED", // Amadeus booking successful means payment completed
            metadata: payment,
          },
        });
      }
    }

    // Remove from cart if cartItemId provided
    if (cartItemId) {
      try {
        await prisma.cartItem.delete({
          where: { id: cartItemId },
        });
      } catch (cartError) {
        console.warn("Failed to remove item from cart:", cartError);
        // Don't fail the booking if cart removal fails
      }
    }

    // Prepare response with flight summary
    const flightOffer = enrichedBooking?.data?.flightOffers?.[0];
    const firstItinerary = flightOffer?.itineraries?.[0];
    const returnItinerary = flightOffer?.itineraries?.[1];

    const bookingResponses = {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      amadeusReference: amadeusRef,
      flight: {
        tripType:
          flightOffer?.summary?.tripType ||
          (returnItinerary ? "Round Trip" : "One Way"),
        outbound: firstItinerary?.summary
          ? {
              origin: firstItinerary.summary.origin,
              destination: firstItinerary.summary.destination,
              departure: firstItinerary.segments?.[0]?.departure?.at,
              arrival:
                firstItinerary.segments?.[firstItinerary.segments.length - 1]
                  ?.arrival?.at,
              duration: firstItinerary.summary.totalDuration,
              stops: firstItinerary.summary.totalStops,
              airlines: firstItinerary.summary.airlines,
            }
          : null,
        return: returnItinerary?.summary
          ? {
              origin: returnItinerary.summary.origin,
              destination: returnItinerary.summary.destination,
              departure: returnItinerary.segments?.[0]?.departure?.at,
              arrival:
                returnItinerary.segments?.[returnItinerary.segments.length - 1]
                  ?.arrival?.at,
              duration: returnItinerary.summary.totalDuration,
              stops: returnItinerary.summary.totalStops,
              airlines: returnItinerary.summary.airlines,
            }
          : null,
        price: {
          total: flightOffer?.price?.total,
          currency: flightOffer?.price?.currency,
          cabinClass: flightOffer?.summary?.cabinClass,
        },
      },
      travelers:
        enrichedBooking?.data?.travelers?.map((t: any) => ({
          name: t.fullName,
          age: t.age,
          type: t.travelerType,
        })) || [],
      totalAmount: totalAmount,
      currency: currency,
      createdAt: booking.createdAt,
    };

    return NextResponse.json(
      {
        message: "Flight booking completed successfully",
        data: bookingResponses,
        enrichedBooking: enrichedBooking, // Full enriched data for reference
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error during flight booking process:", error);

    return NextResponse.json(
      {
        message: "Internal server error during flight booking",
        error: "BOOKING_FAILED",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


