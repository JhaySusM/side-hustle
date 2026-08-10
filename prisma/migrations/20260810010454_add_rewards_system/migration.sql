-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referralConversionCreditedAt" TIMESTAMP(3),
ADD COLUMN     "referralPointsBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "referenceId" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPromotion" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "promotionType" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "badgeType" TEXT NOT NULL DEFAULT 'referrer',
    "pointsSpent" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardsSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "referralPointsPerConversion" INTEGER NOT NULL DEFAULT 100,
    "minListingsForConversion" INTEGER NOT NULL DEFAULT 1,
    "fraudDetectionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "premiumSlotCost" INTEGER NOT NULL DEFAULT 300,
    "premiumSlotDurationDays" INTEGER NOT NULL DEFAULT 7,
    "boostCost" INTEGER NOT NULL DEFAULT 150,
    "boostDurationDays" INTEGER NOT NULL DEFAULT 3,
    "badgeCost" INTEGER NOT NULL DEFAULT 500,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointsTransaction_userId_createdAt_idx" ON "PointsTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PointsTransaction_type_createdAt_idx" ON "PointsTransaction"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ProductPromotion_productId_endsAt_idx" ON "ProductPromotion"("productId", "endsAt");

-- CreateIndex
CREATE INDEX "ProductPromotion_promotionType_endsAt_idx" ON "ProductPromotion"("promotionType", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_key" ON "UserBadge"("userId");

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPromotion" ADD CONSTRAINT "ProductPromotion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
