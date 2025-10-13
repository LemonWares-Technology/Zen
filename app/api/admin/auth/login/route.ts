import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: `Missing required parameters: [ Email, Password ]` },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { message: `Invalid credentials or admin not found` },
        { status: 401 }
      );
    }

    // For demo purposes, we'll accept any password for admin@zen.com
    // In production, you should hash and compare passwords properly
    if (email === "admin@zen.com" && password === "admin123") {
      // Update last login
      await prisma.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });
    } else {
      return NextResponse.json(
        { message: `Invalid credentials` },
        { status: 401 }
      );
    }

    // Generate admin token ( longer expiry for admin )

    const adminToken = jwt.sign(
      { id: admin.id, email: admin.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    const { password: _, ...adminData } = admin;

    return NextResponse.json({
      message: "Admin login successful",
      token: adminToken,
      user: adminData,
    });
  } catch (error: any) {
    console.error(`Error occured during admin sigin: `, error);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
