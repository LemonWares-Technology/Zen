import { generateTokens } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: `Missing required parameters: [ Email, Password ]` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: `Invalid credentials` },
        { status: 404 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { message: `Account has not been verified` },
        { status: 403 }
      );
    }

    const password_valid = await compare(password, user?.password || "");

    if (!password_valid) {
      return NextResponse.json(
        { message: `Invalid password` },
        { status: 403 }
      );
    }

    const tokens = generateTokens(user.id, user.email);

    await prisma.token.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        type: "REFRESH_TOKEN",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // This should be 7 days
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: `Login successful`, user: userWithoutPassword, ...tokens },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error occured during login:`, error);

    return NextResponse.json(
      { message: `Internal server error:`, error },
      { status: 500 }
    );
  }
}
