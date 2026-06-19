"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Input } from "reactstrap";
import { uploadMessageImage } from "@/lib/message-client";
import {
  formatCurrency,
  PAYMENT_METHOD_OPTIONS,
} from "@/lib/transaction-utils";

function getStatusColor(status) {
  if (status === "completed") {
    return "success";
  }

  if (status === "void") {
    return "secondary";
  }

  if (status === "ready_for_completion") {
    return "info";
  }

  return "warning";
}

function getFeeStatusColor(status) {
  if (status === "verified") {
    return "success";
  }

  if (status === "submitted") {
    return "info";
  }

  return "warning";
}

function getHelperCopy(transaction, currentUserId, conversation) {
  if (!transaction) {
    const isSeller = conversation?.sellerId === currentUserId;
    return isSeller
      ? "Set the final meetup amount so both sides can confirm the deal and your platform fee can be tracked."
      : "Set or confirm the final meetup amount here before marking the deal as completed.";
  }

  if (transaction.status === "pending_confirmation") {
    if (transaction.myAmountConfirmedAt) {
      return transaction.isSeller
        ? "You confirmed the final amount. Waiting for the buyer to confirm it before the meetup can be completed."
        : "You confirmed the final amount. Waiting for the seller to confirm it before the meetup can be completed.";
    }

    return "Review the final meetup amount and confirm it when both sides agree.";
  }

  if (transaction.status === "ready_for_completion") {
    if (transaction.myCompletedAt) {
      return transaction.isSeller
        ? "You marked the meetup complete. Waiting for the buyer to mark the deal done."
        : "You marked the meetup complete. Waiting for the seller to mark the deal done.";
    }

    return "Both sides agreed on the amount. Mark the deal done after the meetup is successful.";
  }

  if (transaction.status === "completed") {
    if (transaction.isSeller && transaction.feePaymentStatus === "unpaid") {
      return "The meetup is complete. Submit your platform fee payment details below so admin can verify the commission.";
    }

    if (transaction.isSeller && transaction.feePaymentStatus === "submitted") {
      return "Your platform fee payment was submitted. Admin will verify it before the fee is marked as paid.";
    }

    return "This transaction is completed and locked.";
  }

  return "This transaction was voided and will not count toward GMV or platform revenue.";
}

export default function ConversationTransactionCard({
  conversation,
  currentUserId,
  compact = false,
  actionError = "",
  onSaveAmount,
  onConfirmAmount,
  onMarkCompleted,
  onVoid,
  onSubmitFeePayment,
}) {
  const transaction = conversation?.transaction || null;
  const [amountInput, setAmountInput] = useState(() => {
    const nextAmount = transaction?.agreedAmount ?? conversation?.listingPrice ?? "";
    return nextAmount ? String(nextAmount) : "";
  });
  const [paymentMethod, setPaymentMethod] = useState(() => transaction?.feePaymentMethod || "");
  const [paymentReference, setPaymentReference] = useState(() => transaction?.feePaymentReference || "");
  const [feeProofFile, setFeeProofFile] = useState(null);
  const [feeProofPreview, setFeeProofPreview] = useState("");
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => () => {
    if (feeProofPreview) {
      URL.revokeObjectURL(feeProofPreview);
    }
  }, [feeProofPreview]);

  if (!conversation) {
    return null;
  }

  async function runAction(actionKey, callback) {
    try {
      setBusyAction(actionKey);
      await callback();
    } finally {
      setBusyAction("");
    }
  }

  function handleProofChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (feeProofPreview) {
      URL.revokeObjectURL(feeProofPreview);
    }

    setFeeProofFile(file);
    setFeeProofPreview(URL.createObjectURL(file));
  }

  async function handleSubmitFee() {
    let feeProofImageUrl = transaction?.feeProofImageUrl || "";

    if (feeProofFile) {
      feeProofImageUrl = await uploadMessageImage(feeProofFile);
    }

    await onSubmitFeePayment({
      paymentMethod,
      paymentReference,
      feeProofImageUrl,
    });

    if (feeProofPreview) {
      URL.revokeObjectURL(feeProofPreview);
    }

    setFeeProofFile(null);
    setFeeProofPreview("");
  }

  const padding = compact ? 12 : 16;
  const headlineSize = compact ? 13 : 15;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #dbe3ea",
        borderRadius: 16,
        padding,
        marginBottom: compact ? 12 : 16,
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
        <div>
          <div style={{ fontSize: headlineSize, fontWeight: 700, color: "#0f172a" }}>
            Meetup Transaction
          </div>
          <div className="text-muted" style={{ fontSize: compact ? 11 : 12 }}>
            {conversation.listingTitle}
          </div>
        </div>
        {transaction ? <Badge color={getStatusColor(transaction.status)}>{transaction.statusLabel}</Badge> : null}
      </div>

      <div className="d-flex flex-wrap gap-3 mb-3" style={{ fontSize: compact ? 12 : 13 }}>
        <div>
          <div className="text-muted">Listing price</div>
          <div className="fw-semibold">{formatCurrency(conversation.listingPrice)}</div>
        </div>
        {transaction ? (
          <>
            <div>
              <div className="text-muted">Final amount</div>
              <div className="fw-semibold">{formatCurrency(transaction.agreedAmount)}</div>
            </div>
          </>
        ) : null}
      </div>

      <div className="small mb-3" style={{ color: "#475569", lineHeight: 1.5 }}>
        {getHelperCopy(transaction, currentUserId, conversation)}
      </div>

      {actionError ? <div className="text-danger small mb-3">{actionError}</div> : null}

      {(!transaction || transaction.canUpdateAmount) ? (
        <div className="d-flex flex-column flex-md-row gap-2 mb-3">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            placeholder="Final agreed amount"
          />
          <Button
            style={{ background: "#0a9e8f", border: "none", whiteSpace: "nowrap" }}
            disabled={!amountInput || busyAction === "save_amount"}
            onClick={() => runAction("save_amount", () => onSaveAmount(amountInput))}
          >
            {busyAction === "save_amount" ? "Saving..." : transaction ? "Update Amount" : "Start Transaction"}
          </Button>
        </div>
      ) : null}

      {transaction ? (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {transaction.canConfirmAmount ? (
            <Button
              color="info"
              disabled={busyAction === "confirm_amount"}
              onClick={() => runAction("confirm_amount", onConfirmAmount)}
            >
              {busyAction === "confirm_amount" ? "Confirming..." : "Confirm Amount"}
            </Button>
          ) : null}
          {transaction.canMarkCompleted ? (
            <Button
              color="success"
              disabled={busyAction === "mark_completed"}
              onClick={() => runAction("mark_completed", onMarkCompleted)}
            >
              {busyAction === "mark_completed" ? "Saving..." : "Mark Deal Done"}
            </Button>
          ) : null}
          {transaction.canVoid ? (
            <Button
              color="light"
              className="border"
              disabled={busyAction === "void"}
              onClick={() => runAction("void", onVoid)}
            >
              {busyAction === "void" ? "Voiding..." : "Void Transaction"}
            </Button>
          ) : null}
        </div>
      ) : null}

      {transaction?.status === "completed" && transaction.isSeller ? (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding,
          }}
        >
          <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <div style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: "#0f172a" }}>
              Platform Fee
            </div>
            <Badge color={getFeeStatusColor(transaction.feePaymentStatus)}>
              {transaction.feePaymentStatusLabel}
            </Badge>
          </div>
          <div className="small text-muted mb-2">
            Commission due: <span className="fw-semibold text-dark">{formatCurrency(transaction.platformFeeAmount)}</span>
          </div>

          {transaction.canSubmitFeePayment ? (
            <div className="d-flex flex-column gap-2">
              <Input
                type="select"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="">Choose payment method</option>
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </Input>
              <Input
                type="text"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="Reference number or note (optional)"
              />
              <Input type="file" accept="image/*" onChange={handleProofChange} />
              {feeProofPreview ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={feeProofPreview}
                    alt="Platform fee proof preview"
                    style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 12, border: "1px solid #dbe3ea" }}
                  />
                </div>
              ) : null}
              <Button
                color="warning"
                disabled={!paymentMethod || busyAction === "submit_fee_payment"}
                onClick={() => runAction("submit_fee_payment", handleSubmitFee)}
              >
                {busyAction === "submit_fee_payment" ? "Submitting..." : "Pay Platform Fee"}
              </Button>
            </div>
          ) : null}

          {transaction.feePaymentMethod ? (
            <div className="small text-muted mt-2">
              Method: <span className="fw-semibold text-dark">{transaction.feePaymentMethod}</span>
            </div>
          ) : null}
          {transaction.feePaymentReference ? (
            <div className="small text-muted mt-1">
              Reference: <span className="fw-semibold text-dark">{transaction.feePaymentReference}</span>
            </div>
          ) : null}
          {transaction.feeProofImageUrl ? (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={transaction.feeProofImageUrl}
                alt="Platform fee proof"
                style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 12, border: "1px solid #dbe3ea" }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}