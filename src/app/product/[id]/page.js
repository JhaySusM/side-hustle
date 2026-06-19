"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Row,
  Spinner,
} from "reactstrap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { sendMessage, uploadMessageImage } from "@/lib/message-client";
import { formatDisplayCurrency } from "@/lib/currency";

const FALLBACK_IMG = "https://placehold.co/800x520?text=No+Image";

function formatPostedDate(value) {
  if (!value) {
    return "Recently listed";
  }

  const postedAt = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - postedAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  if (diffDays < 14) {
    return "1 week ago";
  }

  return postedAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProductImage({ src, alt, className }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMG);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(FALLBACK_IMG)}
      className={className}
    />
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [reportType, setReportType] = useState("scam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportImage, setReportImage] = useState(null);
  const [reportImagePreview, setReportImagePreview] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);

      try {
        const response = await fetch(`/api/products/${id}`, { cache: "no-store" });
        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch product.");
        }

        setProduct(data.product);
        setError("");
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Failed to fetch product.");
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    async function loadViewer() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (!cancelled) {
          setViewer(response.ok && data.user ? data.user : null);
        }
      } catch {
        if (!cancelled) {
          setViewer(null);
        }
      }
    }

    loadProduct();
    loadViewer();

    return () => {
      cancelled = true;
    };
  }, [id]);

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

  function handleReportImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (reportImagePreview) {
      URL.revokeObjectURL(reportImagePreview);
    }

    setReportImage(file);
    setReportImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmitReport() {
    setReportError("");
    setReportSuccess("");

    if (!viewer) {
      setReportError("Please sign in to submit a report.");
      return;
    }

    if (!product?.id || !product?.user?.id) {
      setReportError("Listing information is unavailable.");
      return;
    }

    if (viewer.id === product.user.id) {
      setReportError("You cannot report your own listing.");
      return;
    }

    setReportSubmitting(true);

    try {
      const imageUrl = reportImage ? await uploadMessageImage(reportImage) : null;
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: product.id,
          reportType,
          details: reportDetails.trim(),
          imageUrl,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report.");
      }

      setReportSuccess("Report submitted. Our team will review this listing shortly.");
      setReportDetails("");
      setReportImage(null);
      if (reportImagePreview) {
        URL.revokeObjectURL(reportImagePreview);
        setReportImagePreview("");
      }
    } catch (submitError) {
      setReportError(submitError.message || "Failed to submit report.");
    } finally {
      setReportSubmitting(false);
    }
  }

  let gallery = [];
  try {
    gallery = product?.images ? JSON.parse(product.images) : [];
  } catch {
    gallery = [];
  }
  gallery = [product?.image, ...gallery].filter(Boolean);

  return (
    <div className="product-detail-page">
      <Navbar />
      <Container className="py-4 py-md-5">
        {loading ? (
          <div className="product-detail-loader">
            <Spinner color="primary" />
            <span>Loading product...</span>
          </div>
        ) : error ? (
          <Alert color="danger">{error}</Alert>
        ) : !product ? (
          <Alert color="warning">Product not found.</Alert>
        ) : (
          <>
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-4">
              <div>
                <p className="product-detail-kicker mb-1">Product page</p>
                <h1 className="product-detail-title mb-0">{product.product_name}</h1>
              </div>
              <Button color="light" className="border" onClick={() => router.back()}>
                {String.fromCharCode(8592)} Back
              </Button>
            </div>

            <Row className="g-4 align-items-start">
              <Col lg={7}>
                <Card className="product-detail-card border-0">
                  <CardBody className="p-3 p-md-4">
                    <div className="product-detail-main-image-wrap">
                      <ProductImage
                        key={gallery[activeImg] || product.image || "fallback-image"}
                        src={gallery[activeImg] || product.image}
                        alt={product.product_name}
                        className="product-detail-main-image"
                      />
                    </div>
                    {gallery.length > 1 ? (
                      <div className="product-detail-thumb-row mt-3">
                        {gallery.map((src, index) => (
                          <button
                            key={`${src}-${index}`}
                            type="button"
                            className={`product-detail-thumb ${index === activeImg ? "is-active" : ""}`}
                            onClick={() => setActiveImg(index)}
                          >
                            <ProductImage src={src} alt={`${product.product_name} ${index + 1}`} className="product-detail-thumb-image" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </CardBody>
                </Card>

                <Card className="product-detail-card border-0 mt-4">
                  <CardBody className="p-4">
                    <h2 className="product-detail-safety-title mb-3">Your safety matters to us!</h2>
                    <ul className="product-detail-safety-list mb-0">
                      <li>Only meet in public / crowded places such as metro stations and malls.</li>
                      <li>Never go alone to meet a buyer / seller, always take someone with you.</li>
                      <li>Check and inspect the product properly before purchasing it.</li>
                      <li>Never pay / transfer any money in advance before inspecting the product.</li>
                    </ul>
                  </CardBody>
                </Card>
              </Col>

              <Col lg={5}>
                <Card className="product-detail-card border-0 mb-4">
                  <CardBody className="p-4">
                    <div className="d-flex gap-2 mb-3 flex-wrap">
                      <Badge pill color={product.product_status === "Sold" ? "secondary" : "success"}>
                        {product.product_status || "Active"}
                      </Badge>
                      <Badge pill color="light" className="text-muted border">
                        {product.category?.category_name || "General"}
                      </Badge>
                    </div>
                    <div className="product-detail-price mb-3">
                      {formatDisplayCurrency(product.price)}
                    </div>
                    <p className="product-detail-meta mb-4">
                      Listed {formatPostedDate(product.upload_date_time)}
                    </p>

                    <div className="product-detail-section">
                      <h2 className="product-detail-section-title">Description</h2>
                      <p className="product-detail-copy mb-0">
                        {product.description?.trim() || "No description provided yet."}
                      </p>
                    </div>
                  </CardBody>
                </Card>

                <Card className="product-detail-card border-0 mb-4">
                  <CardBody className="p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="product-detail-seller-avatar">
                        {(product.user?.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-semibold">{product.user?.name || "Unknown seller"}</div>
                        <div className="product-detail-meta">{product.user?.email || "Seller profile"}</div>
                        <div className="product-detail-meta">
                          ⭐ {(Number(product.user?.sellerRatingAvg || 0)).toFixed(1)} ({Number(product.user?.sellerRatingCount || 0)} review{Number(product.user?.sellerRatingCount || 0) !== 1 ? "s" : ""})
                        </div>
                        {product.user?.address ? (
                          <div className="product-detail-meta">{product.user.address}</div>
                        ) : null}
                      </div>
                    </div>
                    <Button className="product-detail-seller-btn w-100" onClick={() => router.push(`/seller/${product.user?.id || ""}`)}>
                      View seller profile
                    </Button>
                  </CardBody>
                </Card>

                <Card className="product-detail-card border-0">
                  <CardBody className="p-4">
                    <h2 className="product-detail-section-title">Contact seller</h2>
                    {sent ? (
                      <Alert color="success" className="mb-0">Message sent! The seller will get back to you soon.</Alert>
                    ) : (
                      <>
                        {messageError ? <Alert color="danger">{messageError}</Alert> : null}
                        <Input
                          type="textarea"
                          rows={4}
                          value={message}
                          placeholder={`Hi, is \"${product.product_name}\" still available?`}
                          onChange={(event) => setMessage(event.target.value)}
                          className="mb-3"
                        />
                        <Button className="product-detail-seller-btn w-100" onClick={handleSendMessage} disabled={sending}>
                          {sending ? "Sending..." : "Send message"}
                        </Button>
                      </>
                    )}
                  </CardBody>
                </Card>

                <Card className="product-detail-card border-0 mt-4">
                  <CardBody className="p-4">
                    <h2 className="product-detail-section-title">Report listing</h2>
                    <p className="product-detail-meta mb-3">Found something suspicious or unsafe? Send a report to our moderation team.</p>

                    {reportError ? <Alert color="danger">{reportError}</Alert> : null}
                    {reportSuccess ? <Alert color="success">{reportSuccess}</Alert> : null}

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Reason</label>
                      <Input
                        type="select"
                        value={reportType}
                        onChange={(event) => setReportType(event.target.value)}
                      >
                        <option value="scam">Scam / Fraud</option>
                        <option value="illegal_item">Illegal Item</option>
                        <option value="fake_item">Fake / Misleading Listing</option>
                        <option value="abusive_seller">Abusive Seller</option>
                        <option value="spam">Spam</option>
                        <option value="wrong_category">Wrong Category</option>
                        <option value="other">Other</option>
                      </Input>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Details</label>
                      <Input
                        type="textarea"
                        rows={3}
                        value={reportDetails}
                        onChange={(event) => setReportDetails(event.target.value)}
                        placeholder="Tell us what happened..."
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Screenshot (optional)</label>
                      <Input type="file" accept="image/*" onChange={handleReportImageChange} />
                      {reportImagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={reportImagePreview}
                          alt="Report preview"
                          style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10, marginTop: 10, border: "1px solid #dbe3ea" }}
                        />
                      ) : null}
                    </div>

                    <Button color="danger" className="w-100" onClick={handleSubmitReport} disabled={reportSubmitting}>
                      {reportSubmitting ? "Submitting..." : "Submit report"}
                    </Button>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
      <Footer />
    </div>
  );
}