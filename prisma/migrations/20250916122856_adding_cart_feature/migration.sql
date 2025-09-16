-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "cartItemId" TEXT;

-- CreateTable
CREATE TABLE "public"."carts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "userId" TEXT,
    "flightOfferData" JSONB NOT NULL,
    "searchParams" JSONB NOT NULL,
    "priceData" JSONB,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "selectedServices" JSONB,
    "isTemporary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."guest_migrations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "guestEmail" TEXT,
    "migratedTo" TEXT,
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "migratedAt" TIMESTAMP(3),

    CONSTRAINT "guest_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carts_userId_key" ON "public"."carts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "carts_sessionId_key" ON "public"."carts"("sessionId");

-- CreateIndex
CREATE INDEX "carts_sessionId_idx" ON "public"."carts"("sessionId");

-- CreateIndex
CREATE INDEX "carts_expiresAt_idx" ON "public"."carts"("expiresAt");

-- CreateIndex
CREATE INDEX "cart_items_cartId_idx" ON "public"."cart_items"("cartId");

-- CreateIndex
CREATE INDEX "cart_items_userId_idx" ON "public"."cart_items"("userId");

-- CreateIndex
CREATE INDEX "cart_items_isTemporary_idx" ON "public"."cart_items"("isTemporary");

-- CreateIndex
CREATE UNIQUE INDEX "guest_migrations_sessionId_key" ON "public"."guest_migrations"("sessionId");

-- CreateIndex
CREATE INDEX "guest_migrations_sessionId_idx" ON "public"."guest_migrations"("sessionId");

-- CreateIndex
CREATE INDEX "guest_migrations_guestEmail_idx" ON "public"."guest_migrations"("guestEmail");

-- CreateIndex
CREATE INDEX "bookings_cartItemId_idx" ON "public"."bookings"("cartItemId");

-- AddForeignKey
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
