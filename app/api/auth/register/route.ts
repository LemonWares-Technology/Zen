

import { generateSecureToken, generateTokens } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } =
      await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: `Missing required parameters: [ Email, Password]` },
        { status: 400 }
      );
    }

    const existing_user = await prisma.user.findUnique({ where: { email } });

    if (existing_user) {
      return NextResponse.json(
        { message: `User already exists` },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: Role.USER,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        tokens: true
      },
    });

    const verificationToken = generateSecureToken();

    await prisma.token.create({
      data: {
        userId: user.id,
        token: verificationToken,
        type: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // This should be 24HRS
      },
    });


    
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // My Send Email Controller would go here.

    const tokens = generateTokens(user.id, user.email);



    return NextResponse.json({
      message: `Registration successful. Please check your email to verify your account.`,
      token: verificationToken,
      user,
      ...tokens,
    });

  } catch (error: any) {
    console.error(`Error registering account:`, error);

    return NextResponse.json(
      { message: `Internal server error:`, error },
      { status: 500 }
    );
  }
}
