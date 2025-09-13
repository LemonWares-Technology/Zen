import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: `Missing required parameters: [ Email ]` },
        { status: 400 }
      );
    }

    const existingUser = await prisma.admin.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { message: `Admin already exists` },
        { status: 409 }
      );
    }

    const admin = await prisma.admin.create({
      data: {
        email,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json(
      { message: `Admin created successfully`, data: admin },
      { status: 201 }
    );


  } catch (error: any) {
    console.error(`Error occured while creating admin account: ${error}`);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
