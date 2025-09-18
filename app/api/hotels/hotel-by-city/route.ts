import getAmadeusToken, { baseURL } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cityName = searchParams.get("cityName");

    if (!cityName) {
      return NextResponse.json(
        { message: "Missing required query parameter: cityName" },
        { status: 400 }
      );
    }

    const token = await getAmadeusToken();

    // Step 1: Get city information (including IATA city code) by city name
    const citySearchParams = new URLSearchParams({
      keyword: cityName,
      subType: "CITY", // search for cities only
      // Optionally limit to a country: countryCode: "US"
    });

    const cityResponse = await fetch(
      `${baseURL}/v1/reference-data/locations?${citySearchParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!cityResponse.ok) {
      const errorDetail = await cityResponse.text();
      return NextResponse.json(
        { message: `Error searching city: ${errorDetail}` },
        { status: cityResponse.status }
      );
    }

    const cityData = await cityResponse.json();
    // Expecting cityData.data to be an array of city matches
    if (!cityData.data || cityData.data.length === 0) {
      return NextResponse.json(
        { message: `No IATA code found for cityName: ${cityName}` },
        { status: 404 }
      );
    }

    // Use the first matched city's IATA code
    const cityCode = cityData.data[0].iataCode;

    if (!cityCode) {
      return NextResponse.json(
        { message: `No IATA city code found for cityName: ${cityName}` },
        { status: 404 }
      );
    }

    // Step 2: Use the city code to get hotels by city
    const hotelSearchParams = new URLSearchParams({
      cityCode,
    });

    const hotelResponse = await fetch(
      `${baseURL}/v1/reference-data/locations/hotels/by-city?${hotelSearchParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!hotelResponse.ok) {
      const errorDetail = await hotelResponse.text();
      return NextResponse.json(
        { message: `Error searching hotels: ${errorDetail}` },
        { status: hotelResponse.status }
      );
    }

    const hotelData = await hotelResponse.json();

    return NextResponse.json(
      {
        message: `Success`,
        cityCode,
        cityName,
        hotels: hotelData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error occurred while searching hotels by cityName:", error);
    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
