import getAmadeusToken, { baseURL } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { upsellFlightOffersBody } = await request.json();

    if (!upsellFlightOffersBody) {
      return NextResponse.json(
        { message: `Missing required parameter: [ UpsellFlightOffersBody ]` },
        { status: 400 }
      );
    }

    const token = await getAmadeusToken();


      const requestBody = {
        data: {
          type: "flight-offers-pricing",
          flightOffers: upsellFlightOffersBody.data.flightOffers,
        },
      };

      console.log(`This is request: `, requestBody)

    const response = await fetch(
      `${baseURL}/v1/shopping/flight-offers/upselling`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-HTTP-Method-Override": "GET",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.text(); // Await and call text() to read body text

      return NextResponse.json(
        { message: `Error occurred: ${errorData}` }, // Use actual error message string
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({ message: `Success`, data }, { status: 200 });
  } catch (error: any) {
    console.error(`Error occurred during flight upsell:`, error);

    return NextResponse.json(
      { message: `Internal server error: ${error.message || error}` },
      { status: 500 }
    );
  }
}
