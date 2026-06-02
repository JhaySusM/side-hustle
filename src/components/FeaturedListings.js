"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardBody, CardTitle, CardText, Badge,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Alert, InputGroup,
} from "reactstrap";
import { sendMessage } from "@/lib/message-client";

const FALLBACK_IMG = "https://placehold.co/400x180?text=No+Image";

function ListingImage({ src, alt, style }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMG);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(FALLBACK_IMG)}
      style={style || { width: "100%", height: 180, objectFit: "cover" }}
    />
  );
}

function DetailModal({ listing, isOpen, toggle, viewer }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [sending, setSending] = useState(false);

  function handleClose() { setSent(false); setError(""); setMessage(""); toggle(); }

  async function handleSend() {
    setError("");
    if (!message.trim()) { setError("Please enter a message."); return; }
    if (!viewer) { setError("Please sign in to send a message."); return; }
    if (!listing?.user?.id) { setError("Seller information is unavailable."); return; }

    setSending(true);
    try {
      await sendMessage({
        listingId: listing.id,
        recipientId: listing.user.id,
        body: message.trim(),
      });
      setSent(true);
      setMessage("");
    } catch (sendError) {
      setError(sendError.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  if (!listing) return null;

  // Build gallery: primary image + extra images from JSON field
  let extraImages = [];
  try { extraImages = listing.images ? JSON.parse(listing.images) : []; } catch (_) {}
  const gallery = [listing.image, ...extraImages].filter(Boolean);
  const currentSrc = gallery[activeImg] || listing.image;

  return (
    <>
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSrc}
            alt={listing.product_name}
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
          />
          {gallery.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg - 1 + gallery.length) % gallery.length); }}
                style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 28, borderRadius: "50%", width: 48, height: 48, cursor: "pointer" }}
              >&#8249;</button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg + 1) % gallery.length); }}
                style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 28, borderRadius: "50%", width: 48, height: 48, cursor: "pointer" }}
              >&#8250;</button>
              <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 13 }}>
                {activeImg + 1} / {gallery.length}
              </div>
            </>
          )}
          <button
            onClick={() => setLightbox(false)}
            style={{ position: "absolute", top: 20, right: 24, background: "none", border: "none", color: "#fff", fontSize: 32, cursor: "pointer", lineHeight: 1 }}
          >&times;</button>
        </div>
      )}
    <Modal isOpen={isOpen} toggle={handleClose} centered size="lg">
      <ModalHeader toggle={handleClose}>Listing Details</ModalHeader>
      <ModalBody className="p-0">
        {/* Main image */}
        <div style={{ position: "relative", cursor: "zoom-in", background: "#000" }} onClick={() => setLightbox(true)}>
          <ListingImage
            src={currentSrc}
            alt={listing.product_name}
            style={{ width: "100%", maxHeight: 300, objectFit: "cover", opacity: 1 }}
          />
          <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 20, pointerEvents: "none" }}>
            {gallery.length > 1 ? `${activeImg + 1} / ${gallery.length} — ` : ""}Click to zoom
          </div>
        </div>
        {/* Thumbnail strip */}
        {gallery.length > 1 && (
          <div className="d-flex gap-2 px-4 pt-3" style={{ overflowX: "auto" }}>
            {gallery.map((src, i) => (
              <div
                key={i}
                onClick={() => setActiveImg(i)}
                style={{
                  flexShrink: 0, width: 64, height: 64, borderRadius: 6, overflow: "hidden",
                  border: i === activeImg ? "2px solid #0a9e8f" : "2px solid #dee2e6",
                  cursor: "pointer", opacity: i === activeImg ? 1 : 0.65,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`img ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}
        <div className="p-4">
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <Badge pill color={listing.status === "Sold" ? "secondary" : "success"} style={{ fontSize: 12 }}>
              {listing.status || "Active"}
            </Badge>
            <Badge pill color="light" className="text-muted border" style={{ fontSize: 12 }}>
              {listing.category?.category_name}
            </Badge>
          </div>
          <h5 className="fw-bold mb-1">{listing.product_name}</h5>
          <div className="fw-bold mb-3" style={{ fontSize: 22, color: "#0d6efd" }}>
            {String.fromCharCode(8369)}{Number(listing.price).toLocaleString()}
          </div>
          {listing.description && (
            <div className="mb-3">
              <div className="fw-semibold small text-muted mb-1">Description</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#444" }}>{listing.description}</p>
            </div>
          )}
          <div
            className="d-flex align-items-center gap-3 p-3 rounded-3 mb-4"
            style={{ background: "#f8fafc", border: "1px solid #e9ecef", cursor: "pointer" }}
            onClick={() => { handleClose(); router.push(`/seller/${listing.user?.id || ""}`); }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "linear-gradient(135deg, #0a9e8f, #0d6efd)",
              color: "#fff", display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: 700, fontSize: 18, flexShrink: 0,
            }}>
              {(listing.user?.name || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="fw-semibold" style={{ fontSize: 14 }}>{listing.user?.name || "Unknown"}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>View profile {String.fromCharCode(8594)}</div>
            </div>
          </div>
          {sent ? (
            <Alert color="success">Message sent! The seller will get back to you soon.</Alert>
          ) : (
            <>
              {error && <Alert color="danger">{error}</Alert>}
              <div className="fw-semibold small mb-1">Send a Message to Seller</div>
              <div className="d-flex gap-2">
                <Input
                  type="text"
                  placeholder={`Hi, is "${listing.product_name}" still available?`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  style={{ fontSize: 14 }}
                />
                <Button
                  onClick={handleSend}
                  disabled={sending}
                  style={{ backgroundColor: "#0a9e8f", border: "none", fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>
            </>
          )}
        </div>
      </ModalBody>
    </Modal>
    </>
  );
}

function ContactModal({ listing, isOpen, toggle, viewer }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  function handleClose() { setSent(false); setError(""); setMessage(""); toggle(); }

  async function handleSend() {
    setError("");
    if (!message.trim()) { setError("Please enter a message."); return; }
    if (!viewer) { setError("Please sign in to send a message."); return; }
    if (!listing?.user?.id) { setError("Seller information is unavailable."); return; }

    setSending(true);
    try {
      await sendMessage({
        listingId: listing.id,
        recipientId: listing.user.id,
        body: message.trim(),
      });
      setSent(true);
      setMessage("");
    } catch (sendError) {
      setError(sendError.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  if (!listing) return null;

  return (
    <Modal isOpen={isOpen} toggle={handleClose} centered>
      <ModalHeader toggle={handleClose}>Contact Seller</ModalHeader>
      <ModalBody>
        <div className="d-flex gap-3 mb-3 p-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e9ecef" }}>
          <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 8, overflow: "hidden", background: "#e9ecef" }}>
            <ListingImage src={listing.image} alt={listing.product_name} />
          </div>
          <div>
            <div className="fw-semibold" style={{ fontSize: 14 }}>{listing.product_name}</div>
            <div className="text-primary fw-bold" style={{ fontSize: 14 }}>{String.fromCharCode(8369)}{Number(listing.price).toLocaleString()}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>Seller: {listing.user?.name || "Unknown"}</div>
          </div>
        </div>
        {sent ? (
          <Alert color="success" className="mb-0">
            Message sent! The seller will get back to you soon.
          </Alert>
        ) : (
          <>
            {error && <Alert color="danger">{error}</Alert>}
            <label className="form-label fw-semibold" style={{ fontSize: 14 }}>Your Message</label>
            <Input
              type="textarea"
              rows={4}
              placeholder={`Hi, is the "${listing.product_name}" still available?`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {sent ? (
          <Button color="secondary" onClick={handleClose}>Close</Button>
        ) : (
          <>
            <Button color="secondary" outline onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending} style={{ backgroundColor: "#0a9e8f", border: "none", fontWeight: 600 }}>
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}

function FeaturedListings({ filter, search: searchProp }) {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [selectedListing, setSelectedListing] = useState(null);
  const [detailListing, setDetailListing] = useState(null);
  const [search, setSearch] = useState(searchProp || "");
  const scrollRef = useRef(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch(`/api/products/active?page=${page}&pageSize=${pageSize}`);
        const data = await res.json();
        if (res.ok && data.products) {
          setListings(data.products);
          setTotal(data.total || 0);
        } else {
          setListings([]);
          setTotal(0);
        }
      } catch {
        setListings([]);
        setTotal(0);
      }
    }
    fetchListings();
  }, [page]);

  useEffect(() => {
    async function fetchViewer() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (response.ok && data.user) {
          setViewer(data.user);
        } else {
          setViewer(null);
        }
      } catch {
        setViewer(null);
      }
    }

    fetchViewer();
  }, []);

  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  }

  let displayed = filter ? listings.filter((l) => l.category?.category_name === filter) : listings;
  if (search) {
    const q = search.toLowerCase();
    displayed = displayed.filter((l) => l.product_name?.toLowerCase().includes(q));
  }

  const heading = search
    ? `Results for "${search}"`
    : filter
    ? `${filter} Listings`
    : "Featured Listings";

  return (
    <section className="container py-4">
      <h3 className="fw-bold mb-1">{heading}</h3>
      <div className="mb-3" style={{ maxWidth: 420 }}>
        <InputGroup>
          <Input
            type="text"
            placeholder="Search for anything..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onKeyDown={(e) => e.key === "Enter" && setPage(1)}
          />
          <Button color="primary" type="button" onClick={() => setPage(1)}>Search</Button>
        </InputGroup>
      </div>
      {filter && !search && (
        <p className="text-muted small mb-3">Showing ads in <strong>{filter}</strong></p>
      )}
      {displayed.length === 0 ? (
        <div className="text-muted py-4 text-center border rounded-3">
          {search
            ? `No listings found for "${search}".`
            : filter
            ? `No listings found in "${filter}" yet.`
            : "No listings yet. Be the first to post an ad!"}
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <div className="d-flex align-items-center justify-content-center gap-2">
            <Button
              size="sm"
              color="light"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ flexShrink: 0, width: 36, height: 36, padding: 0, fontSize: 18, fontWeight: 700 }}
            >
              &#8249;
            </Button>
          <div
            ref={scrollRef}
            className="listings-scroll"
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              padding: "8px 4px",
              flex: 1,
              justifyContent: "center",
            }}
          >
            {displayed.map((item) => (
              <div key={item.id} style={{ minWidth: 220, maxWidth: 220, flexShrink: 0 }}>
                <Card
                  className="h-100 shadow-sm d-flex flex-column"
                  style={{ cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
                  onClick={() => setDetailListing(item)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                >
                  <ListingImage src={item.image} alt={item.product_name} />
                  <CardBody className="d-flex flex-column">
                    <Badge color="secondary" pill className="mb-2 align-self-start">{item.category?.category_name}</Badge>
                    <CardTitle tag="h6" className="fw-semibold">{item.product_name}</CardTitle>
                    <CardText className="text-primary fw-bold">{String.fromCharCode(8369)}{Number(item.price).toLocaleString()}</CardText>
                    <div className="text-muted small mb-3">
                      by{" "}
                      <span
                        style={{ color: "#0a9e8f", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}
                        onClick={(e) => { e.stopPropagation(); router.push(`/seller/${item.user?.id || ""}`); }}
                      >
                        {item.user?.name || "Unknown"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="mt-auto w-100"
                      onClick={(e) => { e.stopPropagation(); setSelectedListing(item); }}
                      style={{ backgroundColor: "#0a9e8f", border: "none", fontWeight: 600 }}
                    >
                      Contact Seller
                    </Button>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
            <Button
              size="sm"
              color="light"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
              style={{ flexShrink: 0, width: 36, height: 36, padding: 0, fontSize: 18, fontWeight: 700 }}
            >
              &#8250;
            </Button>
          </div>
          <div className="text-center mt-2 small text-muted">
            Page {page} of {Math.ceil(total / pageSize) || 1}
          </div>
        </div>
      )}

      <ContactModal
        key={selectedListing?.id || "empty-contact"}
        listing={selectedListing}
        isOpen={!!selectedListing}
        toggle={() => setSelectedListing(null)}
        viewer={viewer}
      />
      <DetailModal
        key={detailListing?.id || "empty-detail"}
        listing={detailListing}
        isOpen={!!detailListing}
        toggle={() => setDetailListing(null)}
        viewer={viewer}
      />
    </section>
  );
}

export default FeaturedListings;
