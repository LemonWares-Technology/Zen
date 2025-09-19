import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
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
      where: { OR: [{ userId: userId }, { sessionId: sessionId }] },
    });

    if (!cart) {
      return NextResponse.json({ message: `Cart not found` }, { status: 404 });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(
      { message: `Cart cleared successfully` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error occured while clearing user cart: ${error}`);

    return NextResponse.json(
      { message: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}
