// app/api/auth/verify-email/route.ts - Debug Version
// import { prisma } from "@/lib/prisma";
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(request: NextRequest) {
//   try {
//     const { token } = await request.json();

//     console.log("🔍 Received token:", token);
//     console.log("🔍 Token length:", token?.length);

//     if (!token) {
//       return NextResponse.json(
//         { message: `Missing required parameter: [ Token ]` },
//         { status: 400 }
//       );
//     }

//     // First, let's check if the token exists at all
//     const anyToken = await prisma.token.findFirst({
//       where: { token },
//       include: { user: true },
//     });

//     console.log("🔍 Found any token:", !!anyToken);
//     if (anyToken) {
//       console.log("🔍 Token details:", {
//         id: anyToken.id,
//         type: anyToken.type,
//         used: anyToken.used,
//         expiresAt: anyToken.expiresAt,
//         currentTime: new Date(),
//         isExpired: anyToken.expiresAt < new Date(),
//       });
//     }

//     // Now check with all conditions
//     const token_record = await prisma.token.findFirst({
//       where: {
//         token,
//         type: "EMAIL_VERIFICATION",
//         used: false,
//         expiresAt: { gt: new Date() },
//       },
//       include: { user: true },
//     });

//     console.log("🔍 Found valid token:", !!token_record);

//     if (!token_record) {
//       // Let's provide more specific error messages
//       if (!anyToken) {
//         return NextResponse.json(
//           { message: `Token not found in database` },
//           { status: 400 }
//         );
//       }

//       if (anyToken.type !== "EMAIL_VERIFICATION") {
//         return NextResponse.json(
//           { message: `Invalid token type: ${anyToken.type}` },
//           { status: 400 }
//         );
//       }

//       if (anyToken.used) {
//         return NextResponse.json(
//           { message: `Token has already been used` },
//           { status: 400 }
//         );
//       }

//       if (anyToken.expiresAt < new Date()) {
//         return NextResponse.json(
//           { message: `Token has expired` },
//           { status: 400 }
//         );
//       }

//       return NextResponse.json(
//         { message: `Invalid or expired token` },
//         { status: 400 }
//       );
//     }

//     console.log("🔍 Updating user and token...");

//     await prisma.$transaction([
//       prisma.user.update({
//         where: { id: token_record.userId },
//         data: {
//           isVerified: true,
//         },
//       }),
//       prisma.token.update({
//         where: { id: token_record.id },
//         data: {
//           used: true,
//         },
//       }),
//     ]);

//     console.log("✅ Email verification successful");

//     return NextResponse.json(
//       { message: `Email verified successfully` },
//       { status: 200 }
//     );
//   } catch (error: any) {
//     console.error(`❌ Error occurred during email verification:`, error);

//     return NextResponse.json(
//       { message: `Internal server error` },
//       { status: 500 }
//     );
//   }
// }

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: `Missing required parameter: [ Token ]` },
        { status: 400 }
      );
    }

    const token_record = await prisma.token.findFirst({
      where: {
        token,
        type: "EMAIL_VERIFICATION",
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!token_record) {
      return NextResponse.json(
        { success: false, message: `Invalid or expired token` },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: token_record.userId },
        data: {
          isVerified: true,
        },
      }),

      prisma.token.update({
        where: { id: token_record.id },
        data: {
          used: true,
        },
      }),
    ]);

    return NextResponse.json(
      { success: true, message: `Email verified successfully` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error occured during email verification:`, error);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
