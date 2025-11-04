import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET - Fetch user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Fetch user preferences
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Default notification preferences if not set
    const defaultPreferences = {
      notifications: {
        email: {
          bookingConfirmations: true,
          promotions: true,
          updates: true,
          reminders: true,
        },
        push: {
          bookingConfirmations: true,
          promotions: false,
          updates: true,
          reminders: true,
        },
        sms: {
          bookingConfirmations: false,
          promotions: false,
          updates: false,
          reminders: false,
        },
      },
    };

    const preferences = user.preferences || defaultPreferences;

    return NextResponse.json(
      {
        preferences,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT - Update user's notification preferences
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { message: "Preferences data is required" },
        { status: 400 }
      );
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        preferences: preferences,
      },
      select: {
        id: true,
        preferences: true,
      },
    });

    return NextResponse.json(
      {
        message: "Notification preferences updated successfully",
        preferences: updatedUser.preferences,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
