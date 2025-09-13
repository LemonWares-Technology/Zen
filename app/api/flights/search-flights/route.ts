// app/api/flights/search-flights/route.ts
import { getRateLimitStatus, processFlightOffers } from "@/lib/amadues-helper";
import getAmadeusToken, { baseURL } from "@/lib/functions";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams: any = request.nextUrl.searchParams;

    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const departure = searchParams.get("departure");
    const adults = searchParams.get("adults") || "1";
    const currency = searchParams.get("currency") || "NGN";
    const max = searchParams.get("max") || "100";
    const children = searchParams.get("children") || "0";
    const infants = searchParams.get("infants") || "0";
    const travelClass = searchParams.get("class"); // Remove default value here
    const nonStop = searchParams.get("nonstop") || "false";
    const returns = searchParams.get("returns");

    // Control processing with query parameter (default true)
    const processData = searchParams.get("process") !== "false";

    if (!origin || !destination || !departure) {
      return NextResponse.json(
        {
          message:
            "Missing required query parameters: origin, destination, departure",
        },
        { status: 400 }
      );
    }

    const token = await getAmadeusToken();

    // Build query parameters for GET request
    const queryParams: Record<string, string> = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departure,
      currencyCode: currency,
      adults: adults,
      children: children,
      infants: infants,
      nonStop: nonStop,
      max: max,
    };

    // Only add returnDate if it exists and is not empty
    if (returns && returns.trim() !== "") {
      queryParams.returnDate = returns;
    }

    // Fix: Only add travelClass if it's provided and is a valid value
    const validTravelClasses = [
      "ECONOMY",
      "PREMIUM_ECONOMY",
      "BUSINESS",
      "FIRST",
    ];
    if (travelClass && validTravelClasses.includes(travelClass.toUpperCase())) {
      queryParams.travelClass = travelClass.toUpperCase();
    }

    const urlSearchParams = new URLSearchParams(queryParams);
    const flightSearchStart = Date.now();

    console.log(
      "Final search URL:",
      `${baseURL}/v2/shopping/flight-offers?${urlSearchParams.toString()}`
    );

    const response = await fetch(
      `${baseURL}/v2/shopping/flight-offers?${urlSearchParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Amadeus API Error:", errorText);
      return NextResponse.json(
        {
          message: `Flight search error: ${response.statusText}`,
          error: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const flightSearchEnd = Date.now();

    let processedFlights = null;
    let processingTime = 0;
    let processingError = null;

    // Process data if requested and available
    if (processData && data.data && data.data.length > 0) {
      const processingStart = Date.now();
      try {
        processedFlights = await processFlightOffers(data.data);
        processingTime = Date.now() - processingStart;
      } catch (error: any) {
        processingError = error.message;
        console.error("Error processing flight data:", error);
        // Don't fail the entire request - just return raw data
      }
    }

    const totalTime = Date.now() - startTime;
    const rateLimitStatus = getRateLimitStatus();

    const responseData: any = {
      message: "Flight search results retrieved successfully",
      meta: {
        count: data.meta?.count || data.data?.length || 0,
        currency: currency,
        searchParams: {
          origin,
          destination,
          departure,
          returns,
          adults,
          children,
          infants,
          travelClass: queryParams.travelClass || "ALL", // Show what was actually used
        },
        performance: {
          totalTime: `${totalTime}ms`,
          flightSearchTime: `${flightSearchEnd - flightSearchStart}ms`,
          processingTime: processData ? `${processingTime}ms` : "0ms (skipped)",
        },
        rateLimitStatus,
      },
    };

    if (processData) {
      if (processedFlights) {
        responseData.data = {
          raw: data.data,
          processed: processedFlights,
        };
      } else {
        // If processing failed, return raw data with warning
        responseData.data = data.data;
        responseData.warning = "Processing failed - returning raw data";
        if (processingError) {
          responseData.processingError = processingError;
        }
      }
    } else {
      responseData.data = data.data;
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error("Error occurred while getting flight search results:", error);

    return NextResponse.json(
      {
        message: `Internal server error: ${error.message || error}`,
        rateLimitStatus: getRateLimitStatus(),
      },
      { status: 500 }
    );
  }
}
