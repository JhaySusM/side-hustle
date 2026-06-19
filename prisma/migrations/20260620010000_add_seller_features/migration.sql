CREATE TABLE "SellerFeature" (
    "id" SERIAL NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "placement" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerFeature_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SellerFeature_sellerId_placement_key" ON "SellerFeature"("sellerId", "placement");
CREATE INDEX "SellerFeature_placement_endsAt_idx" ON "SellerFeature"("placement", "endsAt");
CREATE INDEX "SellerFeature_sellerId_endsAt_idx" ON "SellerFeature"("sellerId", "endsAt");

ALTER TABLE "SellerFeature" ADD CONSTRAINT "SellerFeature_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;