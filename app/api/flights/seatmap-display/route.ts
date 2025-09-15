import getAmadeusToken, { baseURL } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

async function getCityName(
  cityCode: string,
  token: string
): Promise<string | null> {
  const cityApiUrl = `${baseURL}/v1/reference-data/locations/cities?keyword=${cityCode}`;
  const response = await fetch(cityApiUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) return null;

  const data = await response.json();
  // The city search returns a data array; find exact or first match to the code
  if (data.data && data.data.length > 0) {
    // Match by iataCode if possible, fallback to first item
    const matchedCity =
      data.data.find((c: any) => c.iataCode === cityCode) || data.data[0];
    return matchedCity.name || null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams: any = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json(
        { message: "Missing required parameter: orderId" },
        { status: 400 }
      );
    }

    const token = await getAmadeusToken();

    // Fetch seatmap from Amadeus API
    const seatmapResponse = await fetch(
      `${baseURL}/v1/shopping/seatmaps?flightOrderId=${orderId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!seatmapResponse.ok) {
      const detail = await seatmapResponse.text();
      return NextResponse.json(
        { message: `Error occurred while fetching seatmap:`, detail },
        { status: seatmapResponse.status }
      );
    }

    const seatmapData = await seatmapResponse.json();

    // Enrich seatmap with city names and seat char descriptions
    const locations = seatmapData.dictionaries?.locations || {};
    const seatCharDefs = seatmapData.dictionaries?.seatCharacteristics || {};

    // Collect unique city codes from seatmap departure and arrival
    const cityCodes = new Set<string>();
    seatmapData.data.forEach((segment: any) => {
      if (segment.departure?.iataCode)
        cityCodes.add(segment.departure.iataCode);
      if (segment.arrival?.iataCode) cityCodes.add(segment.arrival.iataCode);
    });

    // Fetch full city names for all city codes in parallel
    const cityCodeToName: Record<string, string> = {};
    await Promise.all(
      Array.from(cityCodes).map(async (code) => {
        const cityName = await getCityName(code, token);
        if (cityName) cityCodeToName[code] = cityName;
      })
    );

    // Enrich each segment with city names and previous enrichments
    seatmapData.data.forEach((segment: any) => {
      // Enrich departure
      if (segment.departure?.iataCode) {
        const depCode = segment.departure.iataCode;
        if (locations[depCode]) {
          segment.departure.cityCode = locations[depCode].cityCode;
          segment.departure.countryCode = locations[depCode].countryCode;
        }
        segment.departure.cityName = cityCodeToName[depCode] || null;
      }
      // Enrich arrival
      if (segment.arrival?.iataCode) {
        const arrCode = segment.arrival.iataCode;
        if (locations[arrCode]) {
          segment.arrival.cityCode = locations[arrCode].cityCode;
          segment.arrival.countryCode = locations[arrCode].countryCode;
        }
        segment.arrival.cityName = cityCodeToName[arrCode] || null;
      }
      // Add seat characteristic descriptions to each seat
      if (segment.decks) {
        segment.decks.forEach((deck: any) => {
          deck.seats.forEach((seat: any) => {
            if (seat.characteristicsCodes) {
              seat.characteristicsDescriptions = seat.characteristicsCodes.map(
                (code: string) => seatCharDefs[code] || code
              );
            } else {
              seat.characteristicsDescriptions = [];
            }
          });
        });
      }
    });

    return NextResponse.json(
      { message: "Success", data: seatmapData },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error occurred while getting seatmap display: ${error}`);
    return NextResponse.json(
      { message: `Internal server error: ${error.message || error}` },
      { status: 500 }
    );
  }
}
