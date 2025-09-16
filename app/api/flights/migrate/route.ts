// app/api/cart/migrate/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, mergeStrategy = "keep_both" } = body;

    if (!userId || !sessionId) {
      return NextResponse.json(
        { message: "Both userId and sessionId are required" },
        { status: 400 }
      );
    }

    // Start a transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Find guest cart
      const guestCart = await tx.cart.findFirst({
        where: { sessionId },
        include: {
          items: true,
          _count: { select: { items: true } },
        },
      });

      if (!guestCart || guestCart._count.items === 0) {
        return {
          message: "No guest cart found or cart is empty",
          migrated: false,
          itemsMigrated: 0,
        };
      }

      // Find or create user cart
      let userCart = await tx.cart.findFirst({
        where: { userId },
        include: {
          items: true,
        },
      });

      let isNewUserCart = false;
      if (!userCart) {
        userCart = await tx.cart.create({
          data: {
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            items: true,
          },
        });
        isNewUserCart = true;
      }

      let migratedCount = 0;
      let duplicatesHandled = 0;
      const migrationResults = [];

      // Process each guest cart item
      for (const guestItem of guestCart.items as any) {
        try {
          // Check for duplicates based on flight offer ID
          let existingItem = null;
          if (
            mergeStrategy === "merge_quantities" ||
            mergeStrategy === "keep_existing"
          ) {
            existingItem = await tx.cartItem.findFirst({
              where: {
                cartId: userCart.id,
                flightOfferData: {
                  path: ["id"],
                  equals: (guestItem.flightOfferData as any)?.id,
                },
              },
            });
          }

          if (existingItem) {
            duplicatesHandled++;

            if (mergeStrategy === "merge_quantities") {
              // Merge quantities
              await tx.cartItem.update({
                where: { id: existingItem.id },
                data: {
                  quantity: existingItem.quantity + guestItem.quantity,
                  selectedServices:
                    guestItem.selectedServices || existingItem.selectedServices,
                  priceData: guestItem.priceData || existingItem.priceData,
                  updatedAt: new Date(),
                },
              });

              migrationResults.push({
                action: "merged",
                guestItemId: guestItem.id,
                userItemId: existingItem.id,
                newQuantity: existingItem.quantity + guestItem.quantity,
              });
            } else if (mergeStrategy === "keep_existing") {
              // Keep existing, ignore guest item
              migrationResults.push({
                action: "ignored",
                guestItemId: guestItem.id,
                userItemId: existingItem.id,
                reason: "Item already exists in user cart",
              });
            }
          } else {
            // Create new item in user cart
            const migratedItem = await tx.cartItem.create({
              data: {
                cartId: userCart.id,
                userId: userId,
                flightOfferData: guestItem.flightOfferData,
                searchParams: guestItem.searchParams,
                priceData: guestItem.priceData,
                quantity: guestItem.quantity,
                selectedServices: guestItem.selectedServices,
                isTemporary: false, // No longer temporary
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });

            migratedCount++;
            migrationResults.push({
              action: "migrated",
              guestItemId: guestItem.id,
              userItemId: migratedItem.id,
              quantity: guestItem.quantity,
            });
          }
        } catch (itemError) {
          console.error(`Error migrating item ${guestItem.id}:`, itemError);
          migrationResults.push({
            action: "failed",
            guestItemId: guestItem.id,
            error: (itemError as any).message,
          });
        }
      }

      // Update guest migration record
      await tx.guestMigration.updateMany({
        where: { sessionId },
        data: {
          migratedTo: userId,
          migratedAt: new Date(),
        },
      });

      // Delete guest cart and items
      await tx.cartItem.deleteMany({
        where: { cartId: guestCart.id },
      });

      await tx.cart.delete({
        where: { id: guestCart.id },
      });

      // Update user cart timestamp
      await tx.cart.update({
        where: { id: userCart.id },
        data: { updatedAt: new Date() },
      });

      return {
        message: "Cart migration completed successfully",
        migrated: true,
        isNewUserCart,
        itemsMigrated: migratedCount,
        duplicatesHandled,
        totalGuestItems: guestCart.items.length,
        mergeStrategy,
        migrationResults,
        userCartId: userCart.id,
      };
    });

    // Get final cart state
    const finalCart = await prisma.cart.findUnique({
      where: { id: result.userCartId },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(
      {
        ...result,
        finalCart,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error migrating cart:", error);
    return NextResponse.json(
      {
        message: `Cart migration failed: ${error.message}`,
        migrated: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
