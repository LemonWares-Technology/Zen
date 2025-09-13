import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ message: `Unauthorized` }, { status: 401 });
    }

    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { message: `Password confirmation is required` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session?.user.id },
    });

    if (!user || !user.password) {
      return NextResponse.json({ message: `User not found` }, { status: 404 });
    }

    const isPasswordValid = await compare(password, user.password || "");

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: `Password is incorrect` },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session?.user.id },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}`,
      },
    });

    return NextResponse.json(
      { message: `Account deactivated successfully` },
      { status: 500 }
      );
      
  } catch (error: any) {
    console.error(`Error deleting account:`, error);

    return NextResponse.json(
      { message: `Internal server error:`, error },
      { status: 500 }
    );
  }
}
