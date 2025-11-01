import { generateTokens, verifyRefreshToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { message: `Missing required parameter: [ Refreshtoken ]` },
        { status: 400 }
      );
    }

    const decoded = verifyRefreshToken(refreshToken);

    const tokenRecord = await prisma.token.findFirst({
      where: {
        token: refreshToken,
        type: "REFRESH_TOKEN",
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!tokenRecord || !tokenRecord.user.isActive) {
      return NextResponse.json({ message: `Invalid refresh token` });
    }

    const tokens = generateTokens(tokenRecord.user.id, tokenRecord.user.email);

    await prisma.$transaction([
      prisma.token.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      }),

      prisma.token.create({
        data: {
          userId: tokenRecord.user.id,
          token: tokens.refreshToken,
          type: "REFRESH_TOKEN",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        message: "Token refreshed successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error occured during token refresh: ${error}`);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
