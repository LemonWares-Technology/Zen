// lib/rate-limit-safe-helpers.ts
import getAmadeusToken, { baseURL } from "@/lib/functions";

// Rate limiting tracking
let rateLimitResetTime = 0;
let isRateLimited = false;
const REQUEST_DELAY = 1000; // 1 second delay between requests
let lastRequestTime = 0;

// Cache with longer duration to reduce API calls
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
let airportCache: any = {};
let airlineCache: any = {};

// Check if we're currently rate limited
function checkRateLimit(): boolean {
  if (isRateLimited && Date.now() < rateLimitResetTime) {
    return true;
  }
  if (Date.now() >= rateLimitResetTime) {
    isRateLimited = false;
  }
  return false;
}

// Add delay between requests to avoid rate limiting
async function delayRequest(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise((resolve) =>
      setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();
}

// Safe API call with rate limit handling
async function safeApiCall(url: string, token: string): Promise<any> {
  if (checkRateLimit()) {
    console.log("Currently rate limited, skipping API call");
    return null;
  }

  await delayRequest();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 429) {
      // Handle rate limiting
      isRateLimited = true;
      const retryAfter = response.headers.get("Retry-After");
      rateLimitResetTime =
        Date.now() + (retryAfter ? parseInt(retryAfter) * 1000 : 60000);
      console.log(
        `Rate limited. Will retry after ${new Date(rateLimitResetTime)}`
      );
      return null;
    }

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("API call failed:", error);
    return null;
  }
}

// Get airport info with proper error handling
export async function getAirportInfo(iataCode: string): Promise<any> {
  // Check cache first
  const cached = airportCache[iataCode];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const token = await getAmadeusToken();
    const data = await safeApiCall(
      `${baseURL}/v1/reference-data/locations?subType=AIRPORT&keyword=${iataCode}&page[limit]=1`,
      token
    );

    if (data && data.data && data.data.length > 0) {
      const airport = data.data[0];
      const airportInfo = {
        name: airport.name || `${iataCode} Airport`,
        cityName: airport.address?.cityName || "Unknown City",
        countryName: airport.address?.countryName || "Unknown Country",
        timeZoneOffset: airport.timeZoneOffset || null,
      };

      // Cache the result
      airportCache[iataCode] = {
        data: airportInfo,
        timestamp: Date.now(),
      };

      return airportInfo;
    }
  } catch (error) {
    console.error(`Error fetching airport info for ${iataCode}:`, error);
  }

  // Return fallback data - this ensures we never return undefined
  const fallback = {
    name: `${iataCode} Airport`,
    cityName: `${iataCode} City`,
    countryName: "Unknown Country",
  };

  // Cache the fallback too to avoid repeated failed calls
  airportCache[iataCode] = {
    data: fallback,
    timestamp: Date.now(),
  };

  return fallback;
}

// Get airline info with proper error handling
export async function getAirlineInfo(iataCode: string): Promise<any> {
  // Check cache first
  const cached = airlineCache[iataCode];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const token = await getAmadeusToken();
    const data = await safeApiCall(
      `${baseURL}/v1/reference-data/airlines?airlineCodes=${iataCode}`,
      token
    );

    if (data && data.data && data.data.length > 0) {
      const airline = data.data[0];
      const airlineInfo = {
        name:
          airline.commonName || airline.businessName || `${iataCode} Airlines`,
      };

      // Cache the result
      airlineCache[iataCode] = {
        data: airlineInfo,
        timestamp: Date.now(),
      };

      return airlineInfo;
    }
  } catch (error) {
    console.error(`Error fetching airline info for ${iataCode}:`, error);
  }

  // Return fallback data - this ensures we never return undefined
  const fallback = {
    name: `${iataCode} Airlines`,
  };

  // Cache the fallback too
  airlineCache[iataCode] = {
    data: fallback,
    timestamp: Date.now(),
  };

  return fallback;
}

// Format duration from ISO 8601 format (PT17H9M) to readable format
export function formatDuration(duration: string): string {
  if (!duration) return "Unknown duration";

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");

  if (hours && minutes) {
    return `${hours}h ${minutes}m`;
  } else if (hours) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

// Format date and time with error handling
export function formatDateTime(dateTime: string): any {
  if (!dateTime) {
    return {
      date: "Unknown date",
      time: "Unknown time",
      full: "Unknown date/time",
    };
  }

  try {
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      full: date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch (error) {
    return {
      date: dateTime.split("T")[0] || "Unknown date",
      time: dateTime.split("T")[1]?.substring(0, 5) || "Unknown time",
      full: dateTime || "Unknown date/time",
    };
  }
}

// Process segment with guaranteed non-null returns
async function processSegment(segment: any): Promise<any> {
  if (!segment) {
    return {
      departure: {
        iataCode: "Unknown",
        airportName: "Unknown Airport",
        cityName: "Unknown",
        countryName: "Unknown",
        terminal: null,
        dateTime: "",
        formatted: formatDateTime(""),
      },
      arrival: {
        iataCode: "Unknown",
        airportName: "Unknown Airport",
        cityName: "Unknown",
        countryName: "Unknown",
        terminal: null,
        dateTime: "",
        formatted: formatDateTime(""),
      },
      airline: { code: "Unknown", name: "Unknown Airline" },
      flightNumber: "Unknown",
      duration: "Unknown",
      stops: 0,
      aircraft: "Unknown",
    };
  }

  // Get airport and airline info with guaranteed returns
  const departureAirport = await getAirportInfo(
    segment.departure?.iataCode || "UNK"
  );
  const arrivalAirport = await getAirportInfo(
    segment.arrival?.iataCode || "UNK"
  );
  const airline = await getAirlineInfo(segment.carrierCode || "UNK");

  const departureTime = formatDateTime(segment.departure?.at || "");
  const arrivalTime = formatDateTime(segment.arrival?.at || "");

  return {
    departure: {
      iataCode: segment.departure?.iataCode || "Unknown",
      airportName: departureAirport.name,
      cityName: departureAirport.cityName,
      countryName: departureAirport.countryName,
      terminal: segment.departure?.terminal || null,
      dateTime: segment.departure?.at || "",
      formatted: departureTime,
    },
    arrival: {
      iataCode: segment.arrival?.iataCode || "Unknown",
      airportName: arrivalAirport.name,
      cityName: arrivalAirport.cityName,
      countryName: arrivalAirport.countryName,
      terminal: segment.arrival?.terminal || null,
      dateTime: segment.arrival?.at || "",
      formatted: arrivalTime,
    },
    airline: {
      code: segment.carrierCode || "Unknown",
      name: airline.name,
    },
    flightNumber: `${segment.carrierCode || "UNK"}${segment.number || "000"}`,
    duration: formatDuration(segment.duration),
    stops: segment.numberOfStops || 0,
    aircraft: segment.aircraft?.code || "Unknown",
  };
}

// Process flight offers with proper error handling
export async function processFlightOffers(flightOffers: any[]): Promise<any[]> {
  if (!flightOffers || !Array.isArray(flightOffers)) {
    return [];
  }

  const processedOffers = [];

  for (const offer of flightOffers) {
    try {
      if (!offer || !offer.itineraries) {
        continue;
      }

      const processedItineraries = [];

      for (const itinerary of offer.itineraries) {
        if (!itinerary || !itinerary.segments) {
          continue;
        }

        const processedSegments = [];
        for (const segment of itinerary.segments) {
          const processedSegment = await processSegment(segment);
          processedSegments.push(processedSegment);
        }

        const totalStops = itinerary.segments.reduce(
          (sum: number, seg: any) => sum + (seg.numberOfStops || 0),
          0
        );

        processedItineraries.push({
          duration: formatDuration(itinerary.duration),
          totalStops,
          segments: processedSegments,
        });
      }

      const validatingAirlineCode =
        offer.validatingAirlineCodes?.[0] || "Unknown";
      const validatingAirline = await getAirlineInfo(validatingAirlineCode);

      processedOffers.push({
        id: offer.id || "unknown",
        price: {
          total: offer.price?.total || "0",
          currency: offer.price?.currency || "USD",
          base: offer.price?.base || "0",
          fees:
            offer.price?.fees?.reduce(
              (sum: number, fee: any) => sum + parseFloat(fee.amount || "0"),
              0
            ) || 0,
          grandTotal: offer.price?.grandTotal || offer.price?.total || "0",
        },
        outbound: processedItineraries[0] || null,
        return: processedItineraries[1] || null,
        validatingAirline: {
          code: validatingAirlineCode,
          name: validatingAirline.name,
        },
        lastTicketingDate: offer.lastTicketingDate || "",
        numberOfBookableSeats: offer.numberOfBookableSeats || 0,
        cabinClass:
          offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ||
          "ECONOMY",
        oneWay: offer.oneWay || false,
        source: offer.source || "GDS",
      });
    } catch (error) {
      console.error("Error processing flight offer:", error);
      // Continue processing other offers instead of failing completely
    }
  }

  return processedOffers;
}

// Get rate limit status
export function getRateLimitStatus() {
  return {
    isRateLimited,
    resetTime: rateLimitResetTime,
    canMakeRequest: !checkRateLimit(),
    cacheStats: {
      airports: Object.keys(airportCache).length,
      airlines: Object.keys(airlineCache).length,
    },
  };
}


export async function enrichPricingResponse(pricingData: any): Promise<any> {
  if (!pricingData || !pricingData.data) {
    return pricingData;
  }

  // Deep clone to preserve original structure
  const enrichedData = JSON.parse(JSON.stringify(pricingData));

  try {
    // Add enrichment metadata at root level
    enrichedData._enriched = {
      processedAt: new Date().toISOString(),
      airports: {},
      airlines: {},
      summary: {},
      rateLimitStatus: getRateLimitStatus(),
    };

    // Process flight offers if they exist
    if (
      enrichedData.data.flightOffers &&
      Array.isArray(enrichedData.data.flightOffers)
    ) {
      // Collect all unique codes for batch processing
      const airportCodes = new Set<string>();
      const airlineCodes = new Set<string>();

      // Extract codes from all flight offers
      for (const offer of enrichedData.data.flightOffers) {
        if (offer.itineraries) {
          for (const itinerary of offer.itineraries) {
            if (itinerary.segments) {
              for (const segment of itinerary.segments) {
                if (segment.departure?.iataCode)
                  airportCodes.add(segment.departure.iataCode);
                if (segment.arrival?.iataCode)
                  airportCodes.add(segment.arrival.iataCode);
                if (segment.carrierCode) airlineCodes.add(segment.carrierCode);
                if (segment.operating?.carrierCode)
                  airlineCodes.add(segment.operating.carrierCode);
              }
            }
          }
        }
        if (offer.validatingAirlineCodes) {
          offer.validatingAirlineCodes.forEach((code: string) =>
            airlineCodes.add(code)
          );
        }
      }

      // Fetch enrichment data in parallel
      const airportPromises = Array.from(airportCodes).map(async (code) => {
        try {
          const info = await getAirportInfo(code);
          return [code, info];
        } catch (error) {
          console.error(`Error fetching airport ${code}:`, error);
          return [
            code,
            {
              name: `${code} Airport`,
              cityName: `${code} City`,
              countryName: "Unknown",
            },
          ];
        }
      });

      const airlinePromises = Array.from(airlineCodes).map(async (code) => {
        try {
          const info = await getAirlineInfo(code);
          return [code, info];
        } catch (error) {
          console.error(`Error fetching airline ${code}:`, error);
          return [code, { name: `${code} Airlines` }];
        }
      });

      // Wait for all enrichment data
      const [airportResults, airlineResults] = await Promise.all([
        Promise.allSettled(airportPromises),
        Promise.allSettled(airlinePromises),
      ]);

      // Store enrichment data
      airportResults.forEach((result) => {
        if (result.status === "fulfilled") {
          const [code, info] = result.value;
          enrichedData._enriched.airports[code] = info;
        }
      });

      airlineResults.forEach((result) => {
        if (result.status === "fulfilled") {
          const [code, info] = result.value;
          enrichedData._enriched.airlines[code] = info;
        }
      });

      // Enrich each flight offer while preserving original structure
      for (
        let offerIndex = 0;
        offerIndex < enrichedData.data.flightOffers.length;
        offerIndex++
      ) {
        const offer = enrichedData.data.flightOffers[offerIndex];

        // Add offer-level enrichment
        offer._enriched = {
          summary: {
            totalPrice: offer.price?.total || "0",
            currency: offer.price?.currency || "USD",
            cabinClass:
              offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ||
              "ECONOMY",
            isBookable: (offer.numberOfBookableSeats || 0) > 0,
            lastTicketingDate: offer.lastTicketingDate || null,
            lastTicketingFormatted: offer.lastTicketingDate
              ? formatDateTime(offer.lastTicketingDate)
              : null,
            validatingAirline: null,
          },
        };

        // Enrich validating airline
        if (offer.validatingAirlineCodes?.[0]) {
          const validatingCode = offer.validatingAirlineCodes[0];
          const validatingAirline =
            enrichedData._enriched.airlines[validatingCode];
          if (validatingAirline) {
            offer._enriched.summary.validatingAirline = {
              code: validatingCode,
              name: validatingAirline.name,
            };
          }
        }

        // Enrich itineraries and segments
        if (offer.itineraries) {
          for (
            let itinIndex = 0;
            itinIndex < offer.itineraries.length;
            itinIndex++
          ) {
            const itinerary = offer.itineraries[itinIndex];

            // Add itinerary-level enrichment
            if (itinerary.duration) {
              itinerary._formattedDuration = formatDuration(itinerary.duration);
            }

            // Calculate total stops
            const totalStops =
              itinerary.segments?.reduce(
                (sum: number, seg: any) => sum + (seg.numberOfStops || 0),
                0
              ) || 0;

            itinerary._enriched = {
              totalStops,
              segmentCount: itinerary.segments?.length || 0,
            };

            // Enrich segments
            if (itinerary.segments) {
              for (
                let segIndex = 0;
                segIndex < itinerary.segments.length;
                segIndex++
              ) {
                const segment = itinerary.segments[segIndex];

                // Ensure required fields exist with fallbacks for booking compatibility
                segment.departure = segment.departure || {};
                segment.arrival = segment.arrival || {};
                segment.departure.iataCode =
                  segment.departure.iataCode || "UNK";
                segment.arrival.iataCode = segment.arrival.iataCode || "UNK";
                segment.carrierCode = segment.carrierCode || "UNK";
                segment.number = segment.number || "000";

                // Add enrichment data without modifying original structure
                const departureAirport =
                  enrichedData._enriched.airports[segment.departure.iataCode];
                const arrivalAirport =
                  enrichedData._enriched.airports[segment.arrival.iataCode];
                const airline =
                  enrichedData._enriched.airlines[segment.carrierCode];

                segment._enriched = {
                  departure: departureAirport
                    ? {
                        airportName: departureAirport.name,
                        cityName: departureAirport.cityName,
                        countryName: departureAirport.countryName,
                        formatted: segment.departure.at
                          ? formatDateTime(segment.departure.at)
                          : null,
                      }
                    : null,
                  arrival: arrivalAirport
                    ? {
                        airportName: arrivalAirport.name,
                        cityName: arrivalAirport.cityName,
                        countryName: arrivalAirport.countryName,
                        formatted: segment.arrival.at
                          ? formatDateTime(segment.arrival.at)
                          : null,
                      }
                    : null,
                  airline: airline
                    ? {
                        name: airline.name,
                        flightNumber: `${segment.carrierCode}${segment.number}`,
                      }
                    : null,
                  formattedDuration: segment.duration
                    ? formatDuration(segment.duration)
                    : null,
                  aircraft: segment.aircraft?.code || "Unknown",
                };
              }
            }
          }
        }

        // Ensure ALL booking-critical fields exist with proper fallbacks
        offer.type = offer.type || "flight-offer";
        offer.source = offer.source || "GDS";
        offer.id = offer.id || `generated-${Date.now()}-${offerIndex}`;
        offer.numberOfBookableSeats = offer.numberOfBookableSeats || 9;
        offer.nonHomogeneous = offer.nonHomogeneous || false;
        offer.oneWay = offer.oneWay !== undefined ? offer.oneWay : true;
        offer.lastTicketingDate =
          offer.lastTicketingDate ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

        // Ensure validatingAirlineCodes exists
        if (
          !offer.validatingAirlineCodes ||
          !Array.isArray(offer.validatingAirlineCodes) ||
          offer.validatingAirlineCodes.length === 0
        ) {
          // Try to get from segments
          const firstSegmentCarrier =
            offer.itineraries?.[0]?.segments?.[0]?.carrierCode;
          offer.validatingAirlineCodes = firstSegmentCarrier
            ? [firstSegmentCarrier]
            : ["XX"];
        }

        // Ensure itineraries exist and are properly structured
        if (!offer.itineraries || !Array.isArray(offer.itineraries)) {
          offer.itineraries = [];
        }

        // Ensure travelerPricings exists and is properly structured
        if (!offer.travelerPricings || !Array.isArray(offer.travelerPricings)) {
          // Create basic traveler pricing structure
          offer.travelerPricings = [
            {
              travelerId: "1",
              fareOption: "STANDARD",
              travelerType: "ADULT",
              price: {
                currency: offer.price?.currency || "USD",
                total: offer.price?.total || "0",
                base: offer.price?.base || offer.price?.total || "0",
              },
              fareDetailsBySegment:
                offer.itineraries?.[0]?.segments?.map(
                  (segment: any, index: number) => ({
                    segmentId: segment.id || `${index + 1}`,
                    cabin: "ECONOMY",
                    fareBasis: "ECONOMY",
                    class: "Y",
                    includedCheckedBags: {
                      quantity: 0,
                    },
                  })
                ) || [],
            },
          ];
        }

        // Ensure pricingOptions exists
        if (!offer.pricingOptions) {
          offer.pricingOptions = {
            fareType: ["PUBLISHED"],
            includedCheckedBagsOnly: false,
          };
        }

        // Ensure price structure is complete
        if (!offer.price) {
          offer.price = {
            currency: "USD",
            total: "0",
            base: "0",
            fees: [],
            grandTotal: "0",
          };
        }
      }

      // Add summary statistics
      enrichedData._enriched.summary = {
        totalOffers: enrichedData.data.flightOffers.length,
        priceRange: {
          min: Math.min(
            ...enrichedData.data.flightOffers.map((o: any) =>
              parseFloat(o.price?.total || "0")
            )
          ),
          max: Math.max(
            ...enrichedData.data.flightOffers.map((o: any) =>
              parseFloat(o.price?.total || "0")
            )
          ),
          currency: enrichedData.data.flightOffers[0]?.price?.currency || "USD",
        },
        availableOffers: enrichedData.data.flightOffers.filter(
          (o: any) => (o.numberOfBookableSeats || 0) > 0
        ).length,
      };
    }
  } catch (error) {
    console.error("Error enriching pricing data:", error);
    // Add error info but don't fail the response
    enrichedData._enriched = {
      error: "Enrichment failed",
      processedAt: new Date().toISOString(),
      originalDataPreserved: true,
    };
  }

  return enrichedData;
}

