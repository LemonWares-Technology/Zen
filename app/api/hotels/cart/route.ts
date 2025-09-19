import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    if (!userId && !sessionId) {
      return NextResponse.json(
        { message: `Either userId or sessionId is required` },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findFirst({
      where: {
        OR: [{ userId: userId }, { sessionId: sessionId }],
      },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cart) {
      return NextResponse.json(
        {
          message: `Hotel Cart is empty`,
          data: { cart: null, hotelItems: [], totalItems: 0 },
        },
        { status: 200 }
      );
    }

    if (cart.expiresAt && cart.expiresAt < new Date()) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return NextResponse.json(
      {
        message: `Hotel cart retrieved successfully`,
        data: {
          cart: {
            id: cart.id,
            userId: cart.userId,
            sessionId: cart.sessionId,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
            expiresAt: cart.expiresAt,
          },
          hotelItems: cart.items.map((item) => ({
            id: item.id,
            hotelOfferData: item.flightOfferData,
            searchParams: item.searchParams,
            quanity: item.quantity,
            isTemporary: item.isTemporary,
            updatedAt: item.updatedAt,
          })),
          totalItems: cart.items.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error occured while getting user details: ${error}`);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
