"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalBody, Button, Badge, Spinner, Alert, Input } from "reactstrap";
import { formatDisplayCurrency } from "@/lib/currency";
import { sendMessage } from "@/lib/message-client";

const FALLBACK_IMG = "https://placehold.co/800x520?text=No+Image";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function LocationPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s6-5.686 6-11a6 6 0 1 0-12 0c0 5.314 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" />
    </svg>
  );
}

function formatPostedDate(value) {
  if (!value) return "Recently listed";
  const postedAt = new Date(value);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - postedAt.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 14) return "1 week ago";
  return postedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ProductQuickViewModal({ productId, isOpen, onClose, viewer }) {
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef(null);

  function handleHandlePointerDown(e) {
    dragStartY.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleHandlePointerMove(e) {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    if (delta > 0) {
      setDragOffset(delta);
    }
  }

  function handleHandlePointerUp() {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    setDragging(false);
    if (dragOffset > 100) {
      onClose();
    }
    setDragOffset(0);
  }

  useEffect(() => {
    if (!isOpen || !productId) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setProduct(null);
    setMessage("");
    setSent(false);
    setMessageError("");
    setDragOffset(0);
    setDragging(false);
    dragStartY.current = null;

    async function loadProduct() {
      try {
        const response = await fetch(`/api/products/${productId}`, { cache: "no-store" });
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) throw new Error(data.error || "Failed to load listing.");
        setProduct(data.product);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Failed to load listing.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [isOpen, productId]);

  async function handleSendMessage() {
    setMessageError("");

    if (!message.trim()) {
      setMessageError("Please enter a message.");
      return;
    }

    if (!viewer) {
      setMessageError("Please sign in to send a message.");
      return;
    }

    if (!product?.user?.id) {
      setMessageError("Seller information is unavailable.");
      return;
    }

    setSending(true);
    try {
      await sendMessage({
        listingId: product.id,
        recipientId: product.user.id,
        body: message.trim(),
      });
      setSent(true);
      setMessage("");
    } catch (sendError) {
      setMessageError(sendError.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} toggle={onClose} modalClassName="product-quickview" contentClassName="product-quickview-content">
      <ModalBody className="p-0">
        {loading ? (
          <div className="product-quickview-loader">
            <Spinner color="primary" />
          </div>
        ) : error ? (
          <div className="p-4">
            <Alert color="danger">{error}</Alert>
            <Button color="light" className="border w-100" onClick={onClose}>Close</Button>
          </div>
        ) : product ? (
          <div
            className="product-quickview-drag-wrap"
            style={{
              transform: `translateY(${dragOffset}px)`,
              transition: dragging ? "none" : "transform 0.2s ease",
            }}
          >
            <div
              className="product-quickview-handle"
              onPointerDown={handleHandlePointerDown}
              onPointerMove={handleHandlePointerMove}
              onPointerUp={handleHandlePointerUp}
              onPointerCancel={handleHandlePointerUp}
            >
              <span className="product-quickview-handle-bar" />
            </div>
            <div className="product-quickview-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image || FALLBACK_IMG}
                alt={product.product_name}
                className="product-quickview-image"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
              />
              <button type="button" className="product-quickview-close" onClick={onClose} aria-label="Close">
                <CloseIcon />
              </button>
            </div>

            <div className="p-4">
              <div className="product-quickview-price">{formatDisplayCurrency(product.price)}</div>
              <h2 className="product-quickview-title">{product.product_name}</h2>
              {product.isPremiumListing ? (
                <Badge pill className="me-2" style={{ background: "#fff7d6", color: "#9a6700" }}>⭐ Premium</Badge>
              ) : product.isBoostedListing ? (
                <Badge pill className="me-2" style={{ background: "#e7f5ff", color: "#0c5da8" }}>🚀 Boosted</Badge>
              ) : null}
              <div className="product-quickview-meta">
                {product.user?.city ? (
                  <span className="d-inline-flex align-items-center gap-1">
                    <LocationPinIcon /> {product.user.city}
                  </span>
                ) : null}
                {product.user?.city ? " · " : ""}
                Posted {formatPostedDate(product.upload_date_time)}
                {product.category?.category_name ? ` · ${product.category.category_name}` : ""}
              </div>

              {product.description?.trim() ? (
                <p className="product-quickview-description">{product.description}</p>
              ) : null}

              <div className="product-quickview-seller">
                <div className="product-quickview-seller-avatar">
                  {(product.user?.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold">
                    {product.user?.name || "Unknown seller"}
                    {product.user?.hasReferrerBadge ? <span title="Referrer badge" className="ms-1">🎖️</span> : null}
                  </div>
                  <div className="text-muted small">
                    ⭐ {(Number(product.user?.sellerRatingAvg || 0)).toFixed(1)} ({Number(product.user?.sellerRatingCount || 0)} review{Number(product.user?.sellerRatingCount || 0) !== 1 ? "s" : ""})
                  </div>
                </div>
                {product.user?.isFeaturedSeller ? (
                  <Badge pill color="warning">Featured</Badge>
                ) : null}
              </div>

              {sent ? (
                <Alert color="success" className="mb-2">Message sent! The seller will get back to you soon.</Alert>
              ) : (
                <>
                  {messageError ? <Alert color="danger" className="mb-2">{messageError}</Alert> : null}
                  <Input
                    type="textarea"
                    rows={2}
                    value={message}
                    placeholder={`Hi, is "${product.product_name}" still available?`}
                    onChange={(event) => setMessage(event.target.value)}
                    className="mb-2"
                  />
                </>
              )}

              <Button color="primary" className="w-100 product-quickview-chat-btn" onClick={sent ? onClose : handleSendMessage} disabled={sending}>
                {sending ? "Sending..." : sent ? "Done" : "Chat with seller"}
              </Button>

              <button
                type="button"
                className="product-quickview-full-link"
                onClick={() => { onClose(); router.push(`/product/${product.id}`); }}
              >
                View full listing →
              </button>

              <div className="product-quickview-safety">
                <strong>Stay safe:</strong> MaalX never handles payment or delivery. Meet in a public place, inspect the item, and pay only after you&apos;re satisfied.
              </div>
            </div>
          </div>
        ) : null}
      </ModalBody>
    </Modal>
  );
}
