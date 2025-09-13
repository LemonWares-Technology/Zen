import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { message: `Missing required parameters: [ Email, Code ]` },
        { status: 403 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
      include: {
        otpCodes: {
          where: {
            code,
            used: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!admin || !admin.isActive || admin.otpCodes.length === 0) {
      return NextResponse.json({ message: `Invalid OTP or admin not found` }, {status: 403});
    }

    await prisma.$transaction([
      prisma.adminOTP.update({
        where: { id: admin.otpCodes[0].id },
        data: { used: true },
      }),

      prisma.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    // Generate admin token ( longer expiry for admin )

    const adminToken = jwt.sign(
      { adminId: admin.id, email: admin.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    //   const { otpCodes, ...adminData } = admin;

    return NextResponse.json(
        {message: `Admin login successful`, admin: admin, token: adminToken}
    )

      
  } catch (error: any) {
    console.error(`Error occured during admin sigin: `, error);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
