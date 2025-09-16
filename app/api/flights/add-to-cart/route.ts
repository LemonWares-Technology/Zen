// app/api/cart/add/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      flightOfferData,
      searchParams,
      priceData,
      selectedServices,
      userId,
      sessionId,
      quantity = 1,
    } = body;

    // Validate required fields
    if (!flightOfferData) {
      return NextResponse.json(
        { message: "Flight offer data is required" },
        { status: 400 }
      );
    }

    // For guest users, sessionId is required
    if (!userId && !sessionId) {
      return NextResponse.json(
        { message: "Either userId or sessionId is required" },
        { status: 400 }
      );
    }

    let cart;
    let isNewCart = false;

    // Find or create cart
    if (userId) {
      // For registered users
      cart = await prisma.cart.findFirst({
        where: { userId },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        isNewCart = true;
      }
    } else {
      // For guest users
      cart = await prisma.cart.findFirst({
        where: { sessionId },
      });

      if (!cart) {
        // Create guest cart with expiry (7 days)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        cart = await prisma.cart.create({
          data: {
            sessionId,
            expiresAt: expiryDate,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        isNewCart = true;

        // Track guest migration
        await prisma.guestMigration.upsert({
          where: { sessionId },
          create: {
            sessionId,
            itemsCount: 1,
            createdAt: new Date(),
          },
          update: {
            itemsCount: {
              increment: 1,
            },
          },
        });
      }
    }

    // Check if this flight offer already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        // You might want to create a unique identifier from the flight offer data
        // For now, we'll check based on offer ID if available
        AND: [
          {
            flightOfferData: {
              path: ["id"],
              equals: flightOfferData.id,
            },
          },
        ],
      },
    });

    let cartItem;

    if (existingItem) {
      // Update existing item quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          selectedServices,
          priceData,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          userId: userId || null,
          flightOfferData,
          searchParams: searchParams || {},
          priceData,
          quantity,
          selectedServices,
          isTemporary: !userId, // Mark as temporary for guest users
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Update cart timestamp
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    // Get updated cart with items count
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
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
        message: "Item added to cart successfully",
        data: {
          cartItem,
          cart: updatedCart,
          isNewCart,
          totalItems: updatedCart?._count.items || 0,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error adding item to cart:", error);
    return NextResponse.json(
      { message: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
