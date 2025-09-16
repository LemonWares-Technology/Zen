

// app/api/cart/get/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
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

    // Find the cart with all items
    const cart = await prisma.cart.findFirst({
      where: {
        OR: [
          { userId: userId },
          { sessionId: sessionId }
        ]
      },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: { items: true }
        }
      }
    });

    if (!cart) {
      return NextResponse.json({
        message: "Cart not found",
        data: {
          cart: null,
          items: [],
          totalItems: 0,
          isEmpty: true
        }
      }, { status: 200 });
    }

    // Calculate total price if price data is available
    let totalPrice = 0;
    let currency = "USD";
    
    cart.items.forEach(item => {
      if (item.priceData && typeof item.priceData === 'object') {
        const priceInfo = item.priceData as any;
        if (priceInfo.total) {
          totalPrice += parseFloat(priceInfo.total) * item.quantity;
          if (priceInfo.currency) {
            currency = priceInfo.currency;
          }
        }
      }
    });

    // Check if cart has expired (for guest carts)
    const isExpired = cart.expiresAt && new Date() > cart.expiresAt;

    return NextResponse.json({
      message: "Cart retrieved successfully",
      data: {
        cart: {
          id: cart.id,
          userId: cart.userId,
          sessionId: cart.sessionId,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
          expiresAt: cart.expiresAt,
          isExpired,
          user: cart.user
        },
        items: cart.items,
        summary: {
          totalItems: cart._count.items,
          totalPrice: totalPrice.toFixed(2),
          currency,
          isEmpty: cart._count.items === 0
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error getting cart:", error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}