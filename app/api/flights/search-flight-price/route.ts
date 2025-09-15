import { enrichPricingResponse, getRateLimitStatus } from "@/lib/amadues-helper";
import getAmadeusToken, { baseURL } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

// import getAmadeusToken, { baseURL } from "@/lib/functions";
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(request: NextRequest) {
//   try {
//     const { priceFlightOffersBody } = await request.json();

//     if (!priceFlightOffersBody) {
//       return NextResponse.json(
//         { message: `Missing required parameter: [ PriceFlightOffersBody ]` },
//         { status: 400 }
//       );
//     }

//     // Validate the structure
//     if (
//       !priceFlightOffersBody.data ||
//       !priceFlightOffersBody.data.flightOffers
//     ) {
//       return NextResponse.json(
//         {
//           message: `Invalid request structure. Expected: { data: { flightOffers: [...] } }`,
//         },
//         { status: 400 }
//       );
//     }

//     const token = await getAmadeusToken();

//     // FIXED: Send the complete structure, not just flightOffers array
//     const requestBody = {
//       data: {
//         type: "flight-offers-pricing",
//         flightOffers: priceFlightOffersBody.data.flightOffers,
//       },
//     };

//     const response = await fetch(
//       `${baseURL}/v1/shopping/flight-offers/pricing`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(requestBody), // Send the complete structure
//       }
//     );

//     if (!response.ok) {
//       // Get detailed error information from Amadeus
//       const errorData = await response.text();
//       console.error(`Amadeus API Error (${response.status}):`, errorData);

//       return NextResponse.json(
//         {
//           message: `Amadeus API error: ${response.statusText}`,
//           details: errorData,
//           status: response.status,
//         },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();

//     return NextResponse.json({ message: `Success:`, data }, { status: 200 });
//   } catch (error: any) {
//     console.error(`Error occurred during search flight price:`, error);

//     return NextResponse.json(
//       { message: `Internal server error: ${error.message || error}` },
//       { status: 500 }
//     );
//   }
// }

export async function POST(request: NextRequest) {
  try {
    const { priceFlightOffersBody } = await request.json();

    if (!priceFlightOffersBody) {
      return NextResponse.json(
        { message: `Missing required parameter: [ PriceFlightOffersBody ]` },
        { status: 400 }
      );
    }

    // Validate the structure
    if (
      !priceFlightOffersBody.data ||
      !priceFlightOffersBody.data.flightOffers
    ) {
      return NextResponse.json(
        {
          message: `Invalid request structure. Expected: { data: { flightOffers: [...] } }`,
        },
        { status: 400 }
      );
    }

    const token = await getAmadeusToken();

    const requestBody = {
      data: {
        type: "flight-offers-pricing",
        flightOffers: priceFlightOffersBody.data.flightOffers,
      },
    };

    const pricingStart = Date.now();

    const response = await fetch(
      `${baseURL}/v1/shopping/flight-offers/pricing`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Amadeus API Error (${response.status}):`, errorData);

      return NextResponse.json(
        {
          message: `Amadeus API error: ${response.statusText}`,
          details: errorData,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const pricingTime = Date.now() - pricingStart;

    // Enrich the pricing response
    const enrichmentStart = Date.now();
    const enrichedData = await enrichPricingResponse(data);
    const enrichmentTime = Date.now() - enrichmentStart;

    return NextResponse.json(
      {
        message: "Flight pricing completed successfully",
        meta: {
          performance: {
            pricingTime: `${pricingTime}ms`,
            enrichmentTime: `${enrichmentTime}ms`,
            totalTime: `${pricingTime + enrichmentTime}ms`,
          },
          rateLimitStatus: getRateLimitStatus(),
          enriched: true,
        },
        data: enrichedData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error occurred during flight pricing:`, error);

    return NextResponse.json(
      { message: `Internal server error: ${error.message || error}` },
      { status: 500 }
    );
  }
}
