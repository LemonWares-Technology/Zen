import getAmadeusToken, { baseURL } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";

// Helper function to resolve IATA code from location name
async function resolveLocationCode(locationName: string, token: string): Promise<string | null> {
  try {
    // First, try with the exact location name
    let response = await fetch(
      `${baseURL}/v1/reference-data/locations?keyword=${encodeURIComponent(locationName)}&subType=AIRPORT,CITY`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Error resolving location: ${response.statusText}`);
      return null;
    }

    let data = await response.json();
    console.log(`Search results for "${locationName}":`, data.data?.length || 0, "results");
    
    if (data.data && data.data.length > 0) {
      // Prefer airport codes, fallback to city codes
      const airport = data.data.find((loc: any) => loc.subType === "AIRPORT");
      const city = data.data.find((loc: any) => loc.subType === "CITY");
      
      const result = (airport || city)?.iataCode;
      if (result) {
        console.log(`Found IATA code: ${result} for "${locationName}"`);
        return result;
      }
    }

    // If no results, try common variations
    const variations = [
      locationName.replace(/airport/i, '').trim(),
      locationName.replace(/international/i, '').trim(),
      locationName.replace(/airport|international/i, '').trim(),
    ];

    for (const variation of variations) {
      if (variation && variation !== locationName) {
        console.log(`Trying variation: "${variation}"`);
        response = await fetch(
          `${baseURL}/v1/reference-data/locations?keyword=${encodeURIComponent(variation)}&subType=AIRPORT,CITY`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          data = await response.json();
          if (data.data && data.data.length > 0) {
            const airport = data.data.find((loc: any) => loc.subType === "AIRPORT");
            const city = data.data.find((loc: any) => loc.subType === "CITY");
            
            const result = (airport || city)?.iataCode;
            if (result) {
              console.log(`Found IATA code: ${result} for variation "${variation}"`);
              return result;
            }
          }
        }
      }
    }
    
    console.log(`No IATA code found for "${locationName}"`);
    return null;
  } catch (error) {
    console.error(`Error resolving location code for ${locationName}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      fromLocation,      // User-friendly: "Paris", "Los Angeles", "CDG Airport"
      toAddress,         // User-friendly: "123 Main Street, Paris"
      toCity,            // User-friendly: "Paris"
      toCountry,         // User-friendly: "France" or "FR"
      pickupDateTime,    // User-friendly: "2024-01-15T10:30:00"
      passengers,        // Simple number: 2
      transferType = "PRIVATE" // Optional: "PRIVATE" or "SHARED"
    } = await request.json();

    // Validate required fields
    if (!fromLocation || !toAddress || !toCity || !pickupDateTime) {
      return NextResponse.json(
        { 
          message: "Missing required fields: fromLocation, toAddress, toCity, pickupDateTime" 
        },
        { status: 400 }
      );
    }

    const token = await getAmadeusToken();

    // Resolve IATA code for the starting location
    let startLocationCode = await resolveLocationCode(fromLocation, token);
    
    if (!startLocationCode) {
      // Try common airport codes as fallback
      const commonAirports: { [key: string]: string } = {
        "cdg": "CDG",
        "cdg airport": "CDG",
        "charles de gaulle": "CDG",
        "charles de gaulle airport": "CDG",
        "paris cdg": "CDG",
        "paris": "CDG",
        "lax": "LAX",
        "lax airport": "LAX",
        "los angeles": "LAX",
        "los angeles international": "LAX",
        "jfk": "JFK",
        "jfk airport": "JFK",
        "new york": "JFK",
        "new york jfk": "JFK",
        "lhr": "LHR",
        "lhr airport": "LHR",
        "london": "LHR",
        "london heathrow": "LHR",
        "frankfurt": "FRA",
        "frankfurt airport": "FRA",
        "miami": "MIA",
        "miami international": "MIA",
        "chicago": "ORD",
        "chicago o'hare": "ORD",
        "atlanta": "ATL",
        "atlanta airport": "ATL",
        "dubai": "DXB",
        "dubai international": "DXB",
        "singapore": "SIN",
        "singapore changi": "SIN",
        "tokyo": "NRT",
        "tokyo narita": "NRT",
        "sydney": "SYD",
        "sydney airport": "SYD"
      };
      
      const normalizedLocation = fromLocation.toLowerCase().trim();
      const fallbackCode = commonAirports[normalizedLocation];
      
      if (fallbackCode) {
        console.log(`Using fallback code: ${fallbackCode} for "${fromLocation}"`);
        startLocationCode = fallbackCode;
      } else {
        return NextResponse.json(
          { 
            message: `Could not find location code for: ${fromLocation}. Please try a more specific location name or use the IATA code directly (e.g., "CDG", "LAX", "JFK")` 
          },
          { status: 400 }
        );
      }
    }

    // Normalize country code (convert "France" to "FR" if needed)
    let countryCode = toCountry;
    if (countryCode && countryCode.length > 2) {
      // Simple mapping for common countries - you can expand this
      const countryMap: { [key: string]: string } = {
        "france": "FR",
        "united states": "US",
        "united kingdom": "GB",
        "germany": "DE",
        "spain": "ES",
        "italy": "IT",
        "netherlands": "NL",
        "canada": "CA",
        "australia": "AU",
        "japan": "JP"
      };
      countryCode = countryMap[countryCode.toLowerCase()] || countryCode;
    }

    // Get geocodes for the destination address using multiple approaches
    let endGeoCode = null;
    
    // Try 1: Search by full address
    try {
      const geocodeResponse = await fetch(
        `${baseURL}/v1/reference-data/locations?keyword=${encodeURIComponent(toAddress)}&subType=ADDRESS&countryCode=${countryCode || "US"}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        console.log("Geocode search response:", JSON.stringify(geocodeData, null, 2));
        
        if (geocodeData.data && geocodeData.data.length > 0) {
          const location = geocodeData.data[0];
          if (location.geoCode) {
            endGeoCode = location.geoCode;
            console.log(`Found geocode for destination: ${endGeoCode}`);
          }
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }

    // Try 2: Search by city if address search failed
    if (!endGeoCode) {
      try {
        const cityGeocodeResponse = await fetch(
          `${baseURL}/v1/reference-data/locations?keyword=${encodeURIComponent(toCity)}&subType=CITY&countryCode=${countryCode || "US"}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (cityGeocodeResponse.ok) {
          const cityGeocodeData = await cityGeocodeResponse.json();
          console.log("City geocode search response:", JSON.stringify(cityGeocodeData, null, 2));
          
          if (cityGeocodeData.data && cityGeocodeData.data.length > 0) {
            const location = cityGeocodeData.data[0];
            if (location.geoCode) {
              endGeoCode = location.geoCode;
              console.log(`Found city geocode for destination: ${endGeoCode}`);
            }
          }
        }
      } catch (error) {
        console.error("City geocoding error:", error);
      }
    }

    // Try 3: Use known coordinates for common destinations
    if (!endGeoCode) {
      const knownCoordinates: { [key: string]: string } = {
        "paris": "48.8566,2.3522",
        "london": "51.5074,-0.1278",
        "new york": "40.7128,-74.0060",
        "los angeles": "34.0522,-118.2437",
        "frankfurt": "50.1109,8.6821",
        "miami": "25.7617,-80.1918",
        "chicago": "41.8781,-87.6298",
        "atlanta": "33.7490,-84.3880",
        "dubai": "25.2048,55.2708",
        "singapore": "1.3521,103.8198",
        "tokyo": "35.6762,139.6503",
        "sydney": "-33.8688,151.2093"
      };
      
      const normalizedCity = toCity.toLowerCase().trim();
      const knownGeoCode = knownCoordinates[normalizedCity];
      
      if (knownGeoCode) {
        endGeoCode = knownGeoCode;
        console.log(`Using known geocode for ${toCity}: ${endGeoCode}`);
      }
    }

    // Build the Amadeus API request body
    const searchBody: any = {
      startLocationCode,
      endAddressLine: toAddress,
      endCityName: toCity,
      endCountryCode: countryCode || "US", // Default to US if not provided
      transferType,
      startDateTime: pickupDateTime,
      passengers: passengers || 1,
    };

    // Add geocode if available
    if (endGeoCode) {
      searchBody.endGeoCode = endGeoCode;
    } else {
      console.log("No geocode found, proceeding without geocode");
    }

    console.log("Final search body:", JSON.stringify(searchBody, null, 2));

    const response = await fetch(`${baseURL}/v1/shopping/transfer-offers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Amadeus API Error:", errorText);
      return NextResponse.json(
        {
          message: `Car search error: ${response.statusText}`,
          error: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Amadeus API response:", JSON.stringify(data, null, 2));

    // Handle different response structures
    let offers = [];
    if (data.data && Array.isArray(data.data)) {
      offers = data.data;
    } else if (Array.isArray(data)) {
      offers = data;
    } else if (data.offers && Array.isArray(data.offers)) {
      offers = data.offers;
    } else {
      console.error("Unexpected response structure:", data);
      return NextResponse.json(
        { message: "Unexpected response format from car search API" },
        { status: 500 }
      );
    }

    // Transform the response to be more user-friendly
    const transformedData = offers.map((offer: any) => ({
      id: offer.id,
      type: offer.type,
      transferType: offer.transferType,
      vehicle: {
        category: offer.vehicle?.category,
        description: offer.vehicle?.description,
        imageUrl: offer.vehicle?.imageURL,
        baggage: offer.vehicle?.baggages?.[0]?.count || 0,
        seats: offer.vehicle?.seats?.[0]?.count || 0
      },
      provider: {
        name: offer.serviceProvider?.name,
        logoUrl: offer.serviceProvider?.logoUrl
      },
      price: {
        total: offer.quotation?.monetaryAmount,
        currency: offer.quotation?.currencyCode,
        taxes: offer.quotation?.totalTaxes?.monetaryAmount
      },
      pickup: {
        location: offer.start?.locationCode,
        dateTime: offer.start?.dateTime
      },
      dropoff: {
        address: offer.end?.address?.line,
        city: offer.end?.address?.cityName,
        dateTime: offer.end?.dateTime
      },
      cancellation: offer.cancellationRules?.[0]?.ruleDescription || "Check provider terms",
      paymentMethods: offer.methodsOfPaymentAccepted
    }));

    return NextResponse.json(
      {
        message: "Success",
        data: transformedData,
        searchInfo: {
          from: fromLocation,
          to: `${toAddress}, ${toCity}`,
          pickupTime: pickupDateTime,
          passengers: passengers || 1
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error occurred during car search: ${error}`);

    return NextResponse.json(
      { message: `Internal server error: ${error.message || error}` },
      { status: 500 }
    );
  }
}
