import { formatDisplayCurrency } from "@/lib/currency";

export const PLATFORM_COMMISSION_RATE = 0.05;

export const TRANSACTION_STATUS_LABELS = {
  pending_confirmation: "Waiting for amount confirmation",
  ready_for_completion: "Ready to complete",
  completed: "Completed",
  void: "Void",
};

export const FEE_PAYMENT_STATUS_LABELS = {
  unpaid: "Unpaid",
  submitted: "Submitted for review",
  verified: "Verified",
};

export const PAYMENT_METHOD_OPTIONS = [
  "Bank Transfer",
  "GCash",
  "Maya",
  "PayMongo",
  "Cash Deposit",
];

function roundToCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(value) {
  return formatDisplayCurrency(value);
}

export function calculateTransactionAmounts(agreedAmount, commissionRate = PLATFORM_COMMISSION_RATE) {
  const normalizedAmount = roundToCurrency(agreedAmount);
  const normalizedRate = Number(commissionRate);
  const platformFeeAmount = roundToCurrency(normalizedAmount * normalizedRate);
  const sellerNetAmount = roundToCurrency(normalizedAmount - platformFeeAmount);

  return {
    agreedAmount: normalizedAmount,
    commissionRate: normalizedRate,
    platformFeeAmount,
    sellerNetAmount,
  };
}

export function serializeTransaction(transaction, currentUserId) {
  if (!transaction) {
    return null;
  }

  const agreedAmount = Number(transaction.agreedAmount);
  const commissionRate = Number(transaction.commissionRate);
  const platformFeeAmount = Number(transaction.platformFeeAmount);
  const sellerNetAmount = Number(transaction.sellerNetAmount);
  const isSeller = transaction.sellerId === currentUserId;
  const myAmountConfirmedAt = isSeller ? transaction.sellerAmountConfirmedAt : transaction.buyerAmountConfirmedAt;
  const otherAmountConfirmedAt = isSeller ? transaction.buyerAmountConfirmedAt : transaction.sellerAmountConfirmedAt;
  const myCompletedAt = isSeller ? transaction.sellerCompletedAt : transaction.buyerCompletedAt;
  const otherCompletedAt = isSeller ? transaction.buyerCompletedAt : transaction.sellerCompletedAt;
  const isCompleted = transaction.status === "completed";
  const isVoid = transaction.status === "void";

  return {
    id: transaction.id,
    conversationId: transaction.conversationId,
    listingId: transaction.listingId,
    buyerId: transaction.buyerId,
    sellerId: transaction.sellerId,
    agreedAmount,
    commissionRate,
    platformFeeAmount,
    sellerNetAmount,
    status: transaction.status,
    statusLabel: TRANSACTION_STATUS_LABELS[transaction.status] || transaction.status,
    feePaymentStatus: transaction.feePaymentStatus,
    feePaymentStatusLabel:
      FEE_PAYMENT_STATUS_LABELS[transaction.feePaymentStatus] || transaction.feePaymentStatus,
    buyerAmountConfirmedAt: transaction.buyerAmountConfirmedAt,
    sellerAmountConfirmedAt: transaction.sellerAmountConfirmedAt,
    buyerCompletedAt: transaction.buyerCompletedAt,
    sellerCompletedAt: transaction.sellerCompletedAt,
    completedAt: transaction.completedAt,
    voidedAt: transaction.voidedAt,
    feePaymentMethod: transaction.feePaymentMethod || "",
    feePaymentReference: transaction.feePaymentReference || "",
    feeProofImageUrl: transaction.feeProofImageUrl || "",
    feePaidAt: transaction.feePaidAt,
    feeVerifiedAt: transaction.feeVerifiedAt,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    isSeller,
    isBuyer: transaction.buyerId === currentUserId,
    myAmountConfirmedAt,
    otherAmountConfirmedAt,
    myCompletedAt,
    otherCompletedAt,
    canUpdateAmount: !isCompleted && !isVoid,
    canConfirmAmount: transaction.status === "pending_confirmation" && !myAmountConfirmedAt,
    canMarkCompleted:
      transaction.status === "ready_for_completion" &&
      Boolean(myAmountConfirmedAt) &&
      !myCompletedAt,
    canVoid: !isCompleted && !isVoid,
    canSubmitFeePayment:
      isSeller && transaction.status === "completed" && transaction.feePaymentStatus === "unpaid",
  };
}