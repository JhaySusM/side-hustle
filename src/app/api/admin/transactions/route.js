import { isAdminRequest } from "@/lib/admin-auth";
import { publishMessageEvent } from "@/lib/message-events";
import { prisma } from "@/lib/prisma";
import { serializeTransaction } from "@/lib/transaction-utils";

function serializeAdminTransaction(transaction) {
  return {
    ...serializeTransaction(transaction, transaction.sellerId),
    buyer: {
      id: transaction.buyer.id,
      name: transaction.buyer.name || transaction.buyer.email,
      email: transaction.buyer.email,
    },
    seller: {
      id: transaction.seller.id,
      name: transaction.seller.name || transaction.seller.email,
      email: transaction.seller.email,
    },
    listing: {
      id: transaction.listing.id,
      title: transaction.listing.product_name,
      status: transaction.listing.product_status,
      price: Number(transaction.listing.price || 0),
    },
  };
}

function buildSummary(transactions) {
  return transactions.reduce(
    (summary, transaction) => {
      const agreedAmount = Number(transaction.agreedAmount || 0);
      const platformFeeAmount = Number(transaction.platformFeeAmount || 0);

      summary.totalCount += 1;

      if (transaction.status === "completed") {
        summary.completedCount += 1;
        summary.gmv += agreedAmount;
        summary.expectedRevenue += platformFeeAmount;
      }

      if (transaction.feePaymentStatus === "submitted") {
        summary.submittedFees += platformFeeAmount;
      }

      if (transaction.feePaymentStatus === "verified") {
        summary.verifiedRevenue += platformFeeAmount;
      }

      if (transaction.status === "completed" && transaction.feePaymentStatus !== "verified") {
        summary.outstandingRevenue += platformFeeAmount;
      }

      return summary;
    },
    {
      totalCount: 0,
      completedCount: 0,
      gmv: 0,
      expectedRevenue: 0,
      verifiedRevenue: 0,
      outstandingRevenue: 0,
      submittedFees: 0,
    }
  );
}

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            product_name: true,
            product_status: true,
            price: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return Response.json({
      transactions: transactions.map(serializeAdminTransaction),
      summary: buildSummary(transactions),
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to load transactions" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const transactionId = Number(body.transactionId);

    if (!transactionId || body.action !== "verify_fee_payment") {
      return Response.json({ error: "transactionId and verify_fee_payment action are required" }, { status: 400 });
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        feePaymentStatus: "verified",
        feeVerifiedAt: new Date(),
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            product_name: true,
            product_status: true,
            price: true,
          },
        },
      },
    });

    publishMessageEvent([updated.buyer.id, updated.seller.id], {
      type: "refresh",
      conversationId: updated.conversationId,
    });

    return Response.json({ transaction: serializeAdminTransaction(updated) });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to verify platform fee payment" },
      { status: 500 }
    );
  }
}