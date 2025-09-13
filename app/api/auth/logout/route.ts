import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    await prisma.token.updateMany({
      where: { token: refreshToken, type: "REFRESH_TOKEN" },
      data: {
        used: true,
      },
    });

      return NextResponse.json(
          {message: `Logged out successfully`}
      )
  } catch (error: any) {
    console.error(`Error occured during logout: ${error}`);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
