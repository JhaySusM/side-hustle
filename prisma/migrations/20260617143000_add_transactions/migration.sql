-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "agreedAmount" DECIMAL(12,2) NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL,
    "platformFeeAmount" DECIMAL(12,2) NOT NULL,
    "sellerNetAmount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_confirmation',
    "feePaymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "buyerAmountConfirmedAt" TIMESTAMP(3),
    "sellerAmountConfirmedAt" TIMESTAMP(3),
    "buyerCompletedAt" TIMESTAMP(3),
    "sellerCompletedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "feePaymentMethod" TEXT,
    "feePaymentReference" TEXT,
    "feeProofImageUrl" TEXT,
    "feePaidAt" TIMESTAMP(3),
    "feeVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_conversationId_key" ON "Transaction"("conversationId");

-- CreateIndex
CREATE INDEX "Transaction_status_completedAt_idx" ON "Transaction"("status", "completedAt");

-- CreateIndex
CREATE INDEX "Transaction_feePaymentStatus_feePaidAt_idx" ON "Transaction"("feePaymentStatus", "feePaidAt");

-- CreateIndex
CREATE INDEX "Transaction_sellerId_status_idx" ON "Transaction"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Transaction_buyerId_status_idx" ON "Transaction"("buyerId", "status");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ProductList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;