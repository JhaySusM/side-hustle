-- AlterTable
ALTER TABLE "User"
ADD COLUMN "sellerRatingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "sellerRatingCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SellerRating" (
    "id" SERIAL NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerRating_buyerId_sellerId_key" ON "SellerRating"("buyerId", "sellerId");

-- CreateIndex
CREATE INDEX "SellerRating_sellerId_createdAt_idx" ON "SellerRating"("sellerId", "createdAt");

-- AddForeignKey
ALTER TABLE "SellerRating" ADD CONSTRAINT "SellerRating_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerRating" ADD CONSTRAINT "SellerRating_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
