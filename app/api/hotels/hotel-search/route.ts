import getAmadeusToken, { baseURL } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

const UNSPLASH_ACCESS_KEY = process.env.SPLASH_ACCESS_KEY! || "";

async function fetchHotelImage(hotelName: string): Promise<string> {
  if (!UNSPLASH_ACCESS_KEY) return ""; // no key, don't fetch

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", hotelName + " hotel building");
  url.searchParams.set("per_page", "1");
  url.searchParams.set("client_id", UNSPLASH_ACCESS_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) return "";

  const data = await response.json();

  console.log(`This is data: `, data)
    
  if (data.results && data.results.length > 0) {
    return data.results[0].urls.small;
  }
  return "";
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const hotelId = searchParams.get("hotelId");
    const adults = searchParams.get("adults") || "1";
    const checkInDate = searchParams.get("checkInDate");
    const checkOutDate = searchParams.get("checkOutDate");
    const currency = searchParams.get("currency") || "NGN";
    const boardType = searchParams.get("boardType");

    if (!hotelId || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        {
          message:
            "Missing required parameters: hotelId, checkInDate, checkOutDate",
        },
        { status: 400 }
      );
    }

    const queryParams: any = {
      hotelIds: hotelId,
      adults,
      currency,
      checkInDate,
      checkOutDate,
    };

    if (boardType && boardType.trim() !== "") {
      queryParams.boardType = boardType;
    }

    const token = await getAmadeusToken();

    const constructParams = new URLSearchParams(queryParams);

    const response = await fetch(
      `${baseURL}/v3/shopping/hotel-offers?${constructParams}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorDetail = await response.text();
      return NextResponse.json(
        { message: `Error occurred: ${errorDetail}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Enrich each hotel offer with a customImageUrl without altering Amadeus fields directly
    for (const offer of data.data) {
      const hotelName = offer.hotel?.name || "";
      const imageUrl = await fetchHotelImage(hotelName);
      offer.hotel.customImageUrl = imageUrl;
    }

    return NextResponse.json({ message: "Success", data }, { status: 200 });
  } catch (error: any) {
    console.error("Error occurred during hotel search:", error);
    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}


// import getAmadeusToken, { baseURL } from "@/lib/functions";
// import { NextRequest, NextResponse } from "next/server";

// const HOTEL_CONTENT_BASEURL = "https://api.amadeus.com/v1/hotels/content"; // hypothetical content API base URL

// // Helper to fetch hotel images from Amadeus Content API (requires Enterprise API access)
// async function fetchHotelImages(
//   hotelId: string,
//   token: string
// ): Promise<string[]> {
//   try {
//     const contentResponse = await fetch(
//       `${HOTEL_CONTENT_BASEURL}/properties/${hotelId}/media`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (!contentResponse.ok) {
//       console.warn(`Failed to get content for hotel ${hotelId}`);
//       return [];
//     }

//     const contentData = await contentResponse.json();
//     // Assuming media array format like [{uri: 'image_url', category: 'EXTERIOR'}, ...]
//     const images =
//       contentData.media
//         ?.filter(
//           (mediaItem: any) =>
//             mediaItem.category === "EXTERIOR" || mediaItem.category === "ROOM"
//         )
//         .map((mediaItem: any) => mediaItem.uri) || [];

//     return images;
//   } catch (err) {
//     console.error(`Error fetching images for hotel ${hotelId}:`, err);
//     return [];
//   }
// }

// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams;

//     const hotelId = searchParams.get("hotelId");
//     const adults = searchParams.get("adults") || "1";
//     const checkInDate = searchParams.get("checkInDate");
//     const checkOutDate = searchParams.get("checkOutDate");
//     const currency = searchParams.get("currency") || "NGN";
//     const boardType = searchParams.get("boardType");

//     if (!hotelId || !checkInDate || !checkOutDate) {
//       return NextResponse.json(
//         {
//           message:
//             "Missing required parameters: hotelId, checkInDate, checkOutDate",
//         },
//         { status: 400 }
//       );
//     }

//     const queryParams: any = {
//       hotelIds: hotelId,
//       adults,
//       currency,
//       checkInDate,
//       checkOutDate,
//     };

//     if (boardType && boardType.trim() !== "") {
//       queryParams.boardType = boardType;
//     }

//     const token = await getAmadeusToken();

//     const constructParams = new URLSearchParams(queryParams);

//     const response = await fetch(
//       `${baseURL}/v3/shopping/hotel-offers?${constructParams}`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (!response.ok) {
//       const errorDetail = await response.text();
//       return NextResponse.json(
//         { message: `Error occurred: ${errorDetail}` },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();

//     // For each hotel offer, enrich with images fetched from Amadeus Hotel Content API
//     // Requires Enterprise API access and appropriate scopes/permissions
//     for (const offer of data.data) {
//       const currentHotelId = offer.hotel?.hotelId;
//       if (currentHotelId) {
//         const images = await fetchHotelImages(currentHotelId, token);
//         offer.hotel.authenticImages = images;
//       } else {
//         offer.hotel.authenticImages = [];
//       }
//     }

//     return NextResponse.json({ message: "Success", data }, { status: 200 });
//   } catch (error: any) {
//     console.error("Error occurred during hotel search:", error);
//     return NextResponse.json(
//       { message: `Internal server error: ${error}` },
//       { status: 500 }
//     );
//   }
// }


