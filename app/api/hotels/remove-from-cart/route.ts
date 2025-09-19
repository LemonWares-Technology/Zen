import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cartItemId = searchParams.get("cartItemId");
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    if (!cartItemId) {
      return NextResponse.json(
        { message: `CartItemId is required` },
        { status: 400 }
      );
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        { message: `Either userId or sessionId is required` },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        OR: [{ userId: userId }, { cart: { sessionId: sessionId } }],
      },
      include: { cart: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { message: `Hotel cart not found or access denied` },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    await prisma.cart.update({
      where: { id: cartItem.cartId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(
      {
        message: `Hotel removed from cart successfully`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error occured while removing from cart: ${error}`);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
