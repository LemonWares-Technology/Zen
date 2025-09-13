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
async function getAirportInfo(iataCode: string): Promise<any> {
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
async function getAirlineInfo(iataCode: string): Promise<any> {
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
