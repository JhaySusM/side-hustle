export async function getSellerOutstandingFeeSummary(prismaClient, sellerId) {
  const [count, aggregate] = await Promise.all([
    prismaClient.transaction.count({
      where: {
        sellerId,
        status: "completed",
        feePaymentStatus: {
          not: "verified",
        },
      },
    }),
    prismaClient.transaction.aggregate({
      where: {
        sellerId,
        status: "completed",
        feePaymentStatus: {
          not: "verified",
        },
      },
      _sum: {
        platformFeeAmount: true,
      },
    }),
  ]);

  return {
    hasOutstandingFees: count > 0,
    outstandingFeeCount: count,
    outstandingFeeAmount: Number(aggregate._sum.platformFeeAmount || 0),
  };
}