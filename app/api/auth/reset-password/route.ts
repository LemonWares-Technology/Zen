import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: `Missing required parameters: [ Token, Newpassword ]` },
        { status: 400 }
      );
    }

    const tokenRecord = await prisma.token.findFirst({
      where: {
        token,
        type: "PASSWORD_RESET",
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, message: `Invalid or expired token` },
        { status: 403 }
      );
    }

    const hashedPassword = await hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { password: hashedPassword },
      }),

      prisma.token.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json(
      { success: true, message: `Password reset successfully` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error occured during password reset: ${error}`);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
