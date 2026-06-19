import { requireRequestUser } from "@/lib/auth";
import { publishMessageEvent } from "@/lib/message-events";
import { prisma } from "@/lib/prisma";
import {
  calculateTransactionAmounts,
  PLATFORM_COMMISSION_RATE,
  serializeTransaction,
} from "@/lib/transaction-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getParticipantIds(conversation) {
  return [conversation.buyerId, conversation.sellerId];
}

function getParticipantRole(conversation, userId) {
  if (conversation.sellerId === userId) {
    return "seller";
  }

  if (conversation.buyerId === userId) {
    return "buyer";
  }

  return null;
}

async function loadConversationForUser(conversationId, userId) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    select: {
      id: true,
      listingId: true,
      buyerId: true,
      sellerId: true,
      listing: {
        select: {
          id: true,
          product_status: true,
        },
      },
      transaction: true,
    },
  });
}

async function loadTransactionForUser(conversationId, userId) {
  return prisma.transaction.findFirst({
    where: {
      conversationId,
      conversation: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    },
    include: {
      conversation: {
        select: {
          id: true,
          buyerId: true,
          sellerId: true,
          listingId: true,
        },
      },
    },
  });
}

function ensurePositiveAmount(rawValue) {
  const amount = Number(rawValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

export async function POST(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const conversationId = Number(body.conversationId);
    const agreedAmount = ensurePositiveAmount(body.agreedAmount);

    if (!conversationId || !agreedAmount) {
      return Response.json({ error: "conversationId and a valid agreedAmount are required" }, { status: 400 });
    }

    const conversation = await loadConversationForUser(conversationId, user.id);

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    const participantRole = getParticipantRole(conversation, user.id);
    if (!participantRole) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (conversation.transaction?.status === "completed" || conversation.transaction?.status === "void") {
      return Response.json({ error: "This transaction can no longer be edited" }, { status: 400 });
    }

    const now = new Date();
    const totals = calculateTransactionAmounts(agreedAmount, PLATFORM_COMMISSION_RATE);
    const isSeller = participantRole === "seller";
    const existing = conversation.transaction;
    const unchangedAmount = existing && Number(existing.agreedAmount) === totals.agreedAmount;

    const baseData = {
      agreedAmount: totals.agreedAmount.toFixed(2),
      commissionRate: totals.commissionRate.toFixed(4),
      platformFeeAmount: totals.platformFeeAmount.toFixed(2),
      sellerNetAmount: totals.sellerNetAmount.toFixed(2),
      status: "pending_confirmation",
      feePaymentStatus: "unpaid",
      buyerCompletedAt: null,
      sellerCompletedAt: null,
      completedAt: null,
      voidedAt: null,
      feePaymentMethod: null,
      feePaymentReference: null,
      feeProofImageUrl: null,
      feePaidAt: null,
      feeVerifiedAt: null,
      buyerAmountConfirmedAt: isSeller ? (unchangedAmount ? existing?.buyerAmountConfirmedAt ?? null : null) : now,
      sellerAmountConfirmedAt: isSeller ? now : (unchangedAmount ? existing?.sellerAmountConfirmedAt ?? null : null),
    };

    if (baseData.buyerAmountConfirmedAt && baseData.sellerAmountConfirmedAt) {
      baseData.status = "ready_for_completion";
    }

    const transaction = existing
      ? await prisma.transaction.update({
          where: { id: existing.id },
          data: baseData,
        })
      : await prisma.transaction.create({
          data: {
            conversationId: conversation.id,
            listingId: conversation.listingId,
            buyerId: conversation.buyerId,
            sellerId: conversation.sellerId,
            ...baseData,
          },
        });

    publishMessageEvent(getParticipantIds(conversation), {
      type: "refresh",
      conversationId: conversation.id,
    });

    return Response.json({ transaction: serializeTransaction(transaction, user.id) });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to save transaction" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const conversationId = Number(body.conversationId);
    const action = body.action;

    if (!conversationId || !action) {
      return Response.json({ error: "conversationId and action are required" }, { status: 400 });
    }

    const existing = await loadTransactionForUser(conversationId, user.id);

    if (!existing) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    const isSeller = existing.sellerId === user.id;
    const now = new Date();
    let data = {};

    if (action === "confirm_amount") {
      if (existing.status !== "pending_confirmation") {
        return Response.json({ error: "Amount is no longer awaiting confirmation" }, { status: 400 });
      }

      data = isSeller
        ? { sellerAmountConfirmedAt: existing.sellerAmountConfirmedAt || now }
        : { buyerAmountConfirmedAt: existing.buyerAmountConfirmedAt || now };

      const nextBuyerConfirmedAt = !isSeller ? (existing.buyerAmountConfirmedAt || now) : existing.buyerAmountConfirmedAt;
      const nextSellerConfirmedAt = isSeller ? (existing.sellerAmountConfirmedAt || now) : existing.sellerAmountConfirmedAt;

      if (nextBuyerConfirmedAt && nextSellerConfirmedAt) {
        data.status = "ready_for_completion";
      }
    } else if (action === "mark_completed") {
      if (existing.status !== "ready_for_completion" && existing.status !== "completed") {
        return Response.json({ error: "Transaction is not ready to complete" }, { status: 400 });
      }

      data = isSeller
        ? { sellerCompletedAt: existing.sellerCompletedAt || now }
        : { buyerCompletedAt: existing.buyerCompletedAt || now };

      const nextBuyerCompletedAt = !isSeller ? (existing.buyerCompletedAt || now) : existing.buyerCompletedAt;
      const nextSellerCompletedAt = isSeller ? (existing.sellerCompletedAt || now) : existing.sellerCompletedAt;

      if (nextBuyerCompletedAt && nextSellerCompletedAt) {
        data.status = "completed";
        data.completedAt = existing.completedAt || now;
      }
    } else if (action === "void") {
      if (existing.status === "completed" || existing.status === "void") {
        return Response.json({ error: "Completed or void transactions cannot be changed" }, { status: 400 });
      }

      data = {
        status: "void",
        voidedAt: now,
      };
    } else if (action === "submit_fee_payment") {
      if (!isSeller) {
        return Response.json({ error: "Only the seller can submit platform fee payment" }, { status: 403 });
      }

      if (existing.status !== "completed") {
        return Response.json({ error: "Transaction must be completed before paying the platform fee" }, { status: 400 });
      }

      const paymentMethod = body.paymentMethod?.trim();
      const paymentReference = body.paymentReference?.trim() || null;
      const feeProofImageUrl = body.feeProofImageUrl?.trim() || null;

      if (!paymentMethod) {
        return Response.json({ error: "paymentMethod is required" }, { status: 400 });
      }

      data = {
        feePaymentStatus: "submitted",
        feePaymentMethod: paymentMethod,
        feePaymentReference: paymentReference,
        feeProofImageUrl,
        feePaidAt: now,
        feeVerifiedAt: null,
      };
    } else {
      return Response.json({ error: "Unsupported transaction action" }, { status: 400 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: { id: existing.id },
        data,
      });

      if (action === "mark_completed" && updatedTransaction.status === "completed") {
        await tx.productList.update({
          where: { id: existing.listingId },
          data: { product_status: "Sold" },
        });
      }

      return updatedTransaction;
    });

    publishMessageEvent(getParticipantIds(existing.conversation), {
      type: "refresh",
      conversationId,
    });

    return Response.json({ transaction: serializeTransaction(transaction, user.id) });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to update transaction" },
      { status: 500 }
    );
  }
}