import getAmadeusToken from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";
import { baseURL } from "@/lib/functions";

export async function GET(request: NextRequest) {
    
  try {
    const searchParams = request.nextUrl.searchParams;

    const autoComplete = searchParams.get("autoComplete");

    if (!autoComplete) {
      return NextResponse.json(
        { message: `Missing required query parameter: [ autoComplete ]` },
        { status: 400 }
      );
    }

    const queryParameters = {
      subType: "CITY,AIRPORT",
      keyword: autoComplete,
    };

    const urlSearchParams = new URLSearchParams(queryParameters);

    const token = await getAmadeusToken();

    const response = await fetch(`${baseURL}/v1/reference-data/locations?${urlSearchParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      return NextResponse.json(
        { message: `Error occured: `, errorDetail },
        { status: response.status }
      );
    }

      const data = await response.json();

      return NextResponse.json(
          { message: `Success`, data },
          {status: 200}
      )
  } catch (error: any) {
    console.error(`Error occured during autoComplete complete: ${error}`);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
