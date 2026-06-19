-- CreateTable
CREATE TABLE "ProductReport" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "reportType" TEXT NOT NULL,
    "details" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "actionTaken" TEXT,
    "adminNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductReport_listingId_status_idx" ON "ProductReport"("listingId", "status");

-- CreateIndex
CREATE INDEX "ProductReport_reporterId_createdAt_idx" ON "ProductReport"("reporterId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductReport_status_createdAt_idx" ON "ProductReport"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ProductReport" ADD CONSTRAINT "ProductReport_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ProductList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReport" ADD CONSTRAINT "ProductReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
