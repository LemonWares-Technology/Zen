import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
}

export async function verifyAdminToken(request: NextRequest): Promise<{
  isValid: boolean;
  user?: AdminUser;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        isValid: false,
        error: "Missing or invalid authorization header",
      };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.role !== "admin") {
      return {
        isValid: false,
        error: "Invalid admin token",
      };
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      return {
        isValid: false,
        error: "Admin not found or inactive",
      };
    }

    return {
      isValid: true,
      user: {
        ...admin,
        role: "admin",
      },
    };
  } catch (error: any) {
    console.error("Token verification error:", error);
    return {
      isValid: false,
      error: "Invalid token",
    };
  }
}

export function createAuthErrorResponse(message: string, status: number = 401) {
  return NextResponse.json(
    { message, error: "Authentication required" },
    { status }
  );
}
