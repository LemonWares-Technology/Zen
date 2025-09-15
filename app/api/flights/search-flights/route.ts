// // app/api/flights/search-flights/route.ts
// import { getRateLimitStatus, processFlightOffers } from "@/lib/amadues-helper";
// import getAmadeusToken, { baseURL } from "@/lib/functions";

import { formatDuration, getAirlineInfo, getAirportInfo, getRateLimitStatus } from "@/lib/amadues-helper";
import getAmadeusToken, { baseURL } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

// import { NextRequest, NextResponse } from "next/server";

// export async function GET(request: NextRequest) {
//   const startTime = Date.now();

//   try {
//     const searchParams: any = request.nextUrl.searchParams;

//     const origin = searchParams.get("origin");
//     const destination = searchParams.get("destination");
//     const departure = searchParams.get("departure");
//     const adults = searchParams.get("adults") || "1";
//     const currency = searchParams.get("currency") || "NGN";
//     const max = searchParams.get("max") || "100";
//     const children = searchParams.get("children") || "0";
//     const infants = searchParams.get("infants") || "0";
//     const travelClass = searchParams.get("class"); // Remove default value here
//     const nonStop = searchParams.get("nonstop") || "false";
//     const returns = searchParams.get("returns");

//     // Control processing with query parameter (default true)
//     const processData = searchParams.get("process") !== "false";

//     if (!origin || !destination || !departure) {
//       return NextResponse.json(
//         {
//           message:
//             "Missing required query parameters: origin, destination, departure",
//         },
//         { status: 400 }
//       );
//     }

//     const token = await getAmadeusToken();

//     // Build query parameters for GET request
//     const queryParams: Record<string, string> = {
//       originLocationCode: origin,
//       destinationLocationCode: destination,
//       departureDate: departure,
//       currencyCode: currency,
//       adults: adults,
//       children: children,
//       infants: infants,
//       nonStop: nonStop,
//       max: max,
//     };

//     // Only add returnDate if it exists and is not empty
//     if (returns && returns.trim() !== "") {
//       queryParams.returnDate = returns;
//     }

//     // Fix: Only add travelClass if it's provided and is a valid value
//     const validTravelClasses = [
//       "ECONOMY",
//       "PREMIUM_ECONOMY",
//       "BUSINESS",
//       "FIRST",
//     ];
//     if (travelClass && validTravelClasses.includes(travelClass.toUpperCase())) {
//       queryParams.travelClass = travelClass.toUpperCase();
//     }

//     const urlSearchParams = new URLSearchParams(queryParams);
//     const flightSearchStart = Date.now();

//     console.log(
//       "Final search URL:",
//       `${baseURL}/v2/shopping/flight-offers?${urlSearchParams.toString()}`
//     );

//     const response = await fetch(
//       `${baseURL}/v2/shopping/flight-offers?${urlSearchParams.toString()}`,
//       {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error("Amadeus API Error:", errorText);
//       return NextResponse.json(
//         {
//           message: `Flight search error: ${response.statusText}`,
//           error: errorText,
//         },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();
//     const flightSearchEnd = Date.now();

//     let processedFlights = null;
//     let processingTime = 0;
//     let processingError = null;

//     // Process data if requested and available
//     if (processData && data.data && data.data.length > 0) {
//       const processingStart = Date.now();
//       try {
//         processedFlights = await processFlightOffers(data.data);
//         processingTime = Date.now() - processingStart;
//       } catch (error: any) {
//         processingError = error.message;
//         console.error("Error processing flight data:", error);
//         // Don't fail the entire request - just return raw data
//       }
//     }

//     const totalTime = Date.now() - startTime;
//     const rateLimitStatus = getRateLimitStatus();

//     const responseData: any = {
//       message: "Flight search results retrieved successfully",
//       meta: {
//         count: data.meta?.count || data.data?.length || 0,
//         currency: currency,
//         searchParams: {
//           origin,
//           destination,
//           departure,
//           returns,
//           adults,
//           children,
//           infants,
//           travelClass: queryParams.travelClass || "ALL", // Show what was actually used
//         },
//         performance: {
//           totalTime: `${totalTime}ms`,
//           flightSearchTime: `${flightSearchEnd - flightSearchStart}ms`,
//           processingTime: processData ? `${processingTime}ms` : "0ms (skipped)",
//         },
//         rateLimitStatus,
//       },
//     };

//     if (processData) {
//       if (processedFlights) {
//         responseData.data = {
//           raw: data.data,
//           processed: processedFlights,
//         };
//       } else {
//         // If processing failed, return raw data with warning
//         responseData.data = data.data;
//         responseData.warning = "Processing failed - returning raw data";
//         if (processingError) {
//           responseData.processingError = processingError;
//         }
//       }
//     } else {
//       responseData.data = data.data;
//     }

//     return NextResponse.json(responseData, { status: 200 });
//   } catch (error: any) {
//     console.error("Error occurred while getting flight search results:", error);

//     return NextResponse.json(
//       {
//         message: `Internal server error: ${error.message || error}`,
//         rateLimitStatus: getRateLimitStatus(),
//       },
//       { status: 500 }
//     );
//   }
// }


async function enrichRawFlightOffers(flightOffers: any[]): Promise<any[]> {
  if (!flightOffers || !Array.isArray(flightOffers)) {
    return [];
  }

  const enrichedOffers = [];

  for (const offer of flightOffers) {
    try {
      // Deep clone the original offer to preserve all original data
      const enrichedOffer = JSON.parse(JSON.stringify(offer));

      // Add enrichment metadata
      enrichedOffer._enriched = {
        processedAt: new Date().toISOString(),
        airports: {},
        airlines: {},
        summary: {}
      };

      // Collect unique codes for batch processing
      const airportCodes = new Set<string>();
      const airlineCodes = new Set<string>();

      // Extract all airport and airline codes from itineraries
      if (enrichedOffer.itineraries) {
        for (const itinerary of enrichedOffer.itineraries) {
          if (itinerary.segments) {
            for (const segment of itinerary.segments) {
              if (segment.departure?.iataCode) {
                airportCodes.add(segment.departure.iataCode);
              }
              if (segment.arrival?.iataCode) {
                airportCodes.add(segment.arrival.iataCode);
              }
              if (segment.carrierCode) {
                airlineCodes.add(segment.carrierCode);
              }
              if (segment.operating?.carrierCode) {
                airlineCodes.add(segment.operating.carrierCode);
              }
            }
          }
        }
      }

      // Add validating airline codes
      if (enrichedOffer.validatingAirlineCodes) {
        enrichedOffer.validatingAirlineCodes.forEach((code: string) => 
          airlineCodes.add(code)
        );
      }

      // Fetch enrichment data for all codes
      const airportPromises = Array.from(airportCodes).map(async (code) => {
        const info = await getAirportInfo(code);
        return [code, info];
      });

      const airlinePromises = Array.from(airlineCodes).map(async (code) => {
        const info = await getAirlineInfo(code);
        return [code, info];
      });

      // Wait for all enrichment data
      const [airportResults, airlineResults] = await Promise.all([
        Promise.allSettled(airportPromises),
        Promise.allSettled(airlinePromises)
      ]);

      // Process airport results
      airportResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const [code, info] = result.value;
          enrichedOffer._enriched.airports[code] = info;
        }
      });

      // Process airline results  
      airlineResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const [code, info] = result.value;
          enrichedOffer._enriched.airlines[code] = info;
        }
      });

      // Enrich segments with additional data while preserving original structure
      if (enrichedOffer.itineraries) {
        for (let i = 0; i < enrichedOffer.itineraries.length; i++) {
          const itinerary = enrichedOffer.itineraries[i];
          
          // Add formatted duration to original structure
          if (itinerary.duration) {
            itinerary._formattedDuration = formatDuration(itinerary.duration);
          }

          if (itinerary.segments) {
            for (let j = 0; j < itinerary.segments.length; j++) {
              const segment = itinerary.segments[j];
              
              // Enrich departure info
              if (segment.departure?.iataCode) {
                const airportInfo = enrichedOffer._enriched.airports[segment.departure.iataCode];
                if (airportInfo) {
                  segment.departure._enriched = {
                    airportName: airportInfo.name,
                    cityName: airportInfo.cityName,
                    countryName: airportInfo.countryName
                  };
                }
              }

              // Enrich arrival info
              if (segment.arrival?.iataCode) {
                const airportInfo = enrichedOffer._enriched.airports[segment.arrival.iataCode];
                if (airportInfo) {
                  segment.arrival._enriched = {
                    airportName: airportInfo.name,
                    cityName: airportInfo.cityName,
                    countryName: airportInfo.countryName
                  };
                }
              }

              // Enrich airline info
              if (segment.carrierCode) {
                const airlineInfo = enrichedOffer._enriched.airlines[segment.carrierCode];
                if (airlineInfo) {
                  segment._enriched = {
                    ...(segment._enriched || {}),
                    airlineName: airlineInfo.name,
                    flightNumber: `${segment.carrierCode}${segment.number || ''}`
                  };
                }
              }

              // Add formatted duration
              if (segment.duration) {
                segment._formattedDuration = formatDuration(segment.duration);
              }

              // Ensure all required fields exist with fallbacks
              segment.departure = segment.departure || {};
              segment.arrival = segment.arrival || {};
              segment.departure.iataCode = segment.departure.iataCode || 'UNK';
              segment.arrival.iataCode = segment.arrival.iataCode || 'UNK';
              segment.carrierCode = segment.carrierCode || 'UNK';
              segment.number = segment.number || '000';
            }
          }
        }
      }

      // Add validating airline enrichment
      if (enrichedOffer.validatingAirlineCodes && enrichedOffer.validatingAirlineCodes[0]) {
        const validatingCode = enrichedOffer.validatingAirlineCodes[0];
        const validatingAirline = enrichedOffer._enriched.airlines[validatingCode];
        if (validatingAirline) {
          enrichedOffer._enriched.validatingAirlineName = validatingAirline.name;
        }
      }

      // Add booking-safe summary
      enrichedOffer._enriched.summary = {
        totalPrice: enrichedOffer.price?.total || '0',
        currency: enrichedOffer.price?.currency || 'USD',
        cabinClass: enrichedOffer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
        isBookable: (enrichedOffer.numberOfBookableSeats || 0) > 0,
        lastTicketingDate: enrichedOffer.lastTicketingDate || null
      };

      // Ensure all required booking fields exist
      enrichedOffer.type = enrichedOffer.type || 'flight-offer';
      enrichedOffer.source = enrichedOffer.source || 'GDS';
      enrichedOffer.nonHomogeneous = enrichedOffer.nonHomogeneous || false;
      enrichedOffer.numberOfBookableSeats = enrichedOffer.numberOfBookableSeats || 9;

      enrichedOffers.push(enrichedOffer);

    } catch (error) {
      console.error('Error enriching flight offer:', error);
      // If enrichment fails, include original offer with error flag
      const fallbackOffer = JSON.parse(JSON.stringify(offer));
      fallbackOffer._enriched = {
        error: 'Enrichment failed',
        processedAt: new Date().toISOString()
      };
      enrichedOffers.push(fallbackOffer);
    }
  }

  return enrichedOffers;
}



export async function GET (request: NextRequest) {
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
    const travelClass = searchParams.get("class");
    const nonStop = searchParams.get("nonstop") || "false";
    const returns = searchParams.get("returns");

    // Control enrichment with query parameter (default true)
    const enrichData = searchParams.get("enrich") !== "false";

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

    if (returns && returns.trim() !== "") {
      queryParams.returnDate = returns;
    }

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

    let finalData = data.data;
    let enrichmentTime = 0;
    let enrichmentError = null;

    // Enrich data if requested and available
    if (enrichData && data.data && data.data.length > 0) {
      const enrichmentStart = Date.now();
      try {
        finalData = await enrichRawFlightOffers(data.data);
        enrichmentTime = Date.now() - enrichmentStart;
      } catch (error: any) {
        enrichmentError = error.message;
        console.error("Error enriching flight data:", error);
        // Fall back to original data
        finalData = data.data;
      }
    }

    const totalTime = Date.now() - startTime;
    const rateLimitStatus = getRateLimitStatus();

    return NextResponse.json(
      {
        message: "Flight search results retrieved successfully",
        meta: {
          count: data.meta?.count || finalData?.length || 0,
          currency: currency,
          enriched: enrichData,
          searchParams: {
            origin,
            destination,
            departure,
            returns,
            adults,
            children,
            infants,
            travelClass: queryParams.travelClass || "ALL",
          },
          performance: {
            totalTime: `${totalTime}ms`,
            flightSearchTime: `${flightSearchEnd - flightSearchStart}ms`,
            enrichmentTime: enrichData
              ? `${enrichmentTime}ms`
              : "0ms (skipped)",
          },
          rateLimitStatus,
          enrichmentError,
        },
        data: finalData,
      },
      { status: 200 }
    );
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