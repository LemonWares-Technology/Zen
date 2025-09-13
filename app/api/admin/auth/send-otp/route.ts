import { generateOTP } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: `Missing required parameter: [ Email ]` },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin || !admin.isActive) {
      return NextResponse.json({ message: `Admin not found` });
    }

    const OTP = generateOTP();

    await prisma.adminOTP.create({
      data: {
        adminId: admin.id,
        code: OTP,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      }, // This should be 10 minutes
    });

    return NextResponse.json(
      { message: `OTP sent to your email`, admin: OTP },
      { status: 200 }
    );


  } catch (error: any) {
    console.error(`Internal server error: ${error}`);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
