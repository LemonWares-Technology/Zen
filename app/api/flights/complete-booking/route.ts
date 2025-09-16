import getAmadeusToken, { baseURL } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

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
      // Calculate flight duration in a more readable format
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

  // Enrich flight offers
  if (enrichedBooking.data?.flightOffers) {
    for (let i = 0; i < enrichedBooking.data.flightOffers.length; i++) {
      const flightOffer = enrichedBooking.data.flightOffers[i];

      // Enrich itineraries
      if (flightOffer.itineraries) {
        for (let j = 0; j < flightOffer.itineraries.length; j++) {
          const itinerary = flightOffer.itineraries[j];
          if (itinerary.segments) {
            itinerary.segments = await enrichFlightSegments(
              itinerary.segments,
              token
            );

            // Add itinerary summary
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

      // Add flight offer summary
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

  // Add enriched traveler information
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

  // Add booking metadata
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
    const { selectedFlightOffer, travelers, contacts, payments } =
      await request.json();

    if (!selectedFlightOffer || !travelers || !contacts) {
      return NextResponse.json(
        {
          message:
            "Missing required parameters: selectedFlightOffer, travelers, contacts",
        },
        { status: 400 }
      );
    }

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
        { message: "Pricing error", details: text },
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
        { message: "Invalid pricing response structure" },
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
        { message: "Booking error", details: text },
        { status: bookingResponse.status }
      );
    }

    const bookingData = await bookingResponse.json();

    // Step 4: Enrich the booking data with real Amadeus API data
    console.log("Enriching booking data with Amadeus APIs...");

    try {
      const enrichedBooking = await enrichBookingData(bookingData, token);

      return NextResponse.json(
        {
          message: "Booking completed successfully",
          booking: enrichedBooking,
        },
        { status: 200 }
      );
    } catch (enrichmentError) {
      console.error("Error during data enrichment:", enrichmentError);

      // If enrichment fails, return original data
      return NextResponse.json(
        {
          message:
            "Booking completed successfully (enrichment partially failed)",
          booking: bookingData,
          enrichmentError:
            enrichmentError instanceof Error
              ? enrichmentError.message
              : String(enrichmentError),
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Error during booking flow:", error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message || error}` },
      { status: 500 }
    );
  }
}
