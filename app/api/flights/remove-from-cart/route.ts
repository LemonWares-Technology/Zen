// app/api/cart/remove/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get("cartItemId");
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");
    const decrementBy = parseInt(searchParams.get("quantity") || "1");

    if (!cartItemId) {
      return NextResponse.json(
        { message: "Cart item ID is required" },
        { status: 400 }
      );
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        { message: "Either userId or sessionId is required" },
        { status: 400 }
      );
    }

    // Find the cart item and verify ownership
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        OR: [
          { userId: userId },
          {
            cart: {
              sessionId: sessionId,
            },
          },
        ],
      },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { message: "Cart item not found or access denied" },
        { status: 404 }
      );
    }

    let updatedItem = null;
    let removed = false;

    // If quantity would be 0 or less, remove the item entirely
    if (cartItem.quantity <= decrementBy) {
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });
      removed = true;
    } else {
      // Otherwise, just decrement the quantity
      updatedItem = await prisma.cartItem.update({
        where: { id: cartItemId },
        data: {
          quantity: cartItem.quantity - decrementBy,
          updatedAt: new Date(),
        },
      });
    }

    // Update cart timestamp
    await prisma.cart.update({
      where: { id: cartItem.cartId },
      data: { updatedAt: new Date() },
    });

    // Update guest migration count if applicable
    if (sessionId && !userId) {
      await prisma.guestMigration.updateMany({
        where: { sessionId },
        data: {
          itemsCount: {
            decrement: removed ? 1 : 0,
          },
        },
      });
    }

    // Get updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: removed ? "Item removed from cart" : "Item quantity updated",
        data: {
          removed,
          updatedItem,
          cart: updatedCart,
          totalItems: updatedCart?._count.items || 0,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error removing item from cart:", error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
