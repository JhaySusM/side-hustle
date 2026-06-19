-- AlterTable
ALTER TABLE "ProductReport"
ADD COLUMN "sellerId" INTEGER,
ALTER COLUMN "listingId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ProductReport_sellerId_status_idx" ON "ProductReport"("sellerId", "status");

-- AddForeignKey
ALTER TABLE "ProductReport" ADD CONSTRAINT "ProductReport_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
