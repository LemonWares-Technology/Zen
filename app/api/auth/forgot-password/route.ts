import { generateSecureToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Environment Variable
const URL = process.env.FRONTEND_URL!;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: `Missing required parameter: [ Email ]` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({
        message: `If email exists, a reset link has been sent.`,
      });
    }

    const resetToken: any = generateSecureToken();
    await prisma.token.create({
      data: {
        userId: user.id,
        token: resetToken,
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // This should be 1HR
      },
    });

    const resetLink = `${process.env.URL}/reset-password?token=${resetToken}`;

    return NextResponse.json({
      message: `If the email exists, a reset link has been sent`,
      token: resetToken,
    });
  } catch (error: any) {
    console.error(`Error occured during password forget: ${error}`);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
