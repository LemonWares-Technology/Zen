import { NextRequest, NextResponse } from "next/server";

export const baseURL: string = "https://test.api.amadeus.com";

const api_key = process.env.AMADEUS_API_KEY!;
const api_secret = process.env.AMADEUS_API_SECRET!;

export default async function getAmadeusToken(): Promise<string> {
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: api_key,
      client_secret: api_secret,
    });

    const response = await fetch(`${baseURL}/v1/security/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
    }

    const data: any = await response.json();

    console.log("Token generated successfully");

    // Return just the access token string, not a NextResponse
    return data.access_token;
  } catch (error: any) {
    console.error("Error occurred during token generation:", error);
    throw new Error(`Token generation failed: ${error.message}`);
  }
}
