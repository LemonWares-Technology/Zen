// app/api/cart/clear/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    if (!userId && !sessionId) {
      return NextResponse.json(
        { message: "Either userId or sessionId is required" },
        { status: 400 }
      );
    }

    // Find the cart
    const cart = await prisma.cart.findFirst({
      where: {
        OR: [{ userId: userId }, { sessionId: sessionId }],
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 });
    }

    const itemCount = cart._count.items;

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    // Update cart timestamp
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    // Reset guest migration count if applicable
    if (sessionId && !userId) {
      await prisma.guestMigration.updateMany({
        where: { sessionId },
        data: {
          itemsCount: 0,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Cart cleared successfully",
        data: {
          cartId: cart.id,
          itemsRemoved: itemCount,
          clearedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
