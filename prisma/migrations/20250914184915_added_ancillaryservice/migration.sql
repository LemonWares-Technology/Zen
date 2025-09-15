-- CreateEnum
CREATE TYPE "public"."AncillaryServiceType" AS ENUM ('FLIGHT', 'HOTEL', 'CAR', 'PACKAGE');

-- CreateTable
CREATE TABLE "public"."AncillaryService" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceType" "public"."AncillaryServiceType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AncillaryService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingAncillary" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "ancillaryServiceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAncillary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AncillaryService_code_key" ON "public"."AncillaryService"("code");

-- AddForeignKey
ALTER TABLE "public"."BookingAncillary" ADD CONSTRAINT "BookingAncillary_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingAncillary" ADD CONSTRAINT "BookingAncillary_ancillaryServiceId_fkey" FOREIGN KEY ("ancillaryServiceId") REFERENCES "public"."AncillaryService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
