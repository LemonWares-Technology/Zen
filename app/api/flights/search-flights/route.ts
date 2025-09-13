import getAmadeusToken, { baseURL } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams: any = request.nextUrl.searchParams;

    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const departure = searchParams.get("departure");
    const adults = searchParams.get("adults") || "1"; // Default to 1 adult
    const currency = searchParams.get("currency") || "NGN";
    const max = searchParams.get("max") || "20";
    const children = searchParams.get("children") || "0";
    const infants = searchParams.get("infants") || "0";
    const classType = searchParams.get("class") || "ECONOMY";
    const nonStop = searchParams.get("nonstop") || "false";
    const returns = searchParams.get("returns");

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

    // Build query parameters for GET request - only include non-null/non-empty values
    const queryParams: Record<string, string> = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departure,
      currencyCode: currency,
      adults: adults,
      children: children,
      infants: infants,
      travelClass: classType,
      nonStop: nonStop,
      max: max,
    };

    // Only add returnDate if it exists and is not empty
    if (returns && returns.trim() !== "") {
      queryParams.returnDate = returns;
    }

    const urlSearchParams = new URLSearchParams(queryParams);

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

    return NextResponse.json(
      {
        message: "Flight search results retrieved successfully",
        data: data, // Return the actual flight offers data
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error occurred while getting flight search results:", error);

    return NextResponse.json(
      { message: `Internal server error: ${error.message || error}` },
      { status: 500 }
    );
  }
}
