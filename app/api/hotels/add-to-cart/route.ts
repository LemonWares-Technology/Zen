import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      sessionId,
      hotelOfferData,
      //   searchParams,
      quantity = 1,
    } = body;

    if (!hotelOfferData) {
      return NextResponse.json(
        { message: `Hotel offer data and search parameters are required` },
        { status: 400 }
      );
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        { message: `Either userId or sessionId is required` },
        { status: 400 }
      );
    }

    let cart;
    if (userId) {
      cart = await prisma.cart.findUnique({
        where: { userId },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId },
        });
      }
    } else {
      cart = await prisma.cart.findUnique({
        where: { sessionId },
      });

      if (!cart) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        cart = await prisma.cart.create({
          data: {
            sessionId,
            expiresAt,
          },
        });
      }
    }

    const queryParams = {
      here: "here",
    };

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        userId: userId || null,
        flightOfferData: hotelOfferData,
        searchParams: queryParams,
        quantity: quantity,
        isTemporary: !userId,
      },
    });

    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(
      {
        message: `Hotel added to cart successfully`,
        cartItem: {
          id: cartItem.id,
          quantity: cartItem.quantity,
          addedAt: cartItem.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(`Error occured while adding to cart: ${error}`);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
