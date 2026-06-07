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

function LocationPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s6-5.686 6-11a6 6 0 1 0-12 0c0 5.314 6 11 6 11Z"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" fill="#3b82f6" />
    </svg>
  );
}

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
  const [search, setSearch] = useState(searchProp || "");
  const scrollRef = useRef(null);
  const normalizedSearch = search.trim();
  const isGroupedHome = !filter && !normalizedSearch;
  const requestPage = isGroupedHome ? 1 : page;
  const requestPageSize = isGroupedHome ? 48 : pageSize;

  useEffect(() => {
    async function fetchListings() {
      try {
        const params = new URLSearchParams({
          page: String(requestPage),
          pageSize: String(requestPageSize),
        });

        if (filter) {
          params.set("category", filter);
        }

        if (normalizedSearch) {
          params.set("q", normalizedSearch);
        }

        const res = await fetch(`/api/products/active?${params.toString()}`);
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
  }, [filter, normalizedSearch, requestPage, requestPageSize]);

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

  const displayed = listings;
  const groupedListings = Object.entries(
    displayed.reduce((accumulator, item) => {
      const categoryName = item.category?.category_name || "General";
      if (!accumulator[categoryName]) {
        accumulator[categoryName] = [];
      }
      accumulator[categoryName].push(item);
      return accumulator;
    }, {})
  );

  const heading = search
    ? `Results for "${search}"`
    : filter
    ? `${filter} Listings`
    : "Featured Listings";

  function openListingsPage() {
    const params = new URLSearchParams();
    if (filter) {
      params.set("category", filter);
    }
    if (search.trim()) {
      params.set("q", search.trim());
    }

    const target = params.toString() ? `/listings?${params.toString()}` : "/listings";
    router.push(target);
  }

  function openCategoryListings(categoryName) {
    const params = new URLSearchParams({ category: categoryName });
    router.push(`/listings?${params.toString()}`);
  }

  function renderListingCard(item) {
    return (
      <div key={item.id} className="featured-listings-card" style={{ minWidth: 220, maxWidth: 220, flexShrink: 0 }}>
        <Card
          className="h-100 shadow-sm d-flex flex-column"
          style={{ cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
          onClick={() => router.push(`/product/${item.id}`)}
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
            {item.user?.address ? (
              <div className="featured-listings-location text-muted small mb-3">
                <LocationPinIcon />
                <span>{item.user.address}</span>
              </div>
            ) : null}
            <div className="text-muted small mb-3">Posted {formatPostedDate(item.upload_date_time)}</div>
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
    );
  }

  return (
    <section className="container py-4">
      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-1">
        <h3 className="fw-bold mb-0">{heading}</h3>
        <Button
          color="light"
          className="featured-listings-see-more"
          onClick={openListingsPage}
        >
          See more
        </Button>
      </div>
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
      ) : isGroupedHome ? (
        <div className="featured-category-list">
          {groupedListings.map(([categoryName, items]) => (
            <div key={categoryName} className="featured-category-section">
              <div className="featured-category-header">
                <h4 className="featured-category-title">{categoryName}</h4>
                <button
                  type="button"
                  className="featured-category-link"
                  onClick={() => openCategoryListings(categoryName)}
                >
                  View More
                </button>
              </div>
              <div className="featured-category-grid listings-scroll">
                {items.slice(0, 4).map((item) => renderListingCard(item))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="featured-listings-shell">
          <div className="featured-listings-row d-flex align-items-center justify-content-center gap-2">
            <Button
              size="sm"
              color="light"
              className="featured-listings-arrow"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ flexShrink: 0, width: 36, height: 36, padding: 0, fontSize: 18, fontWeight: 700 }}
            >
              &#8249;
            </Button>
            <div
              ref={scrollRef}
              className="listings-scroll featured-listings-track"
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
              {displayed.map((item) => renderListingCard(item))}
            </div>
            <Button
              size="sm"
              color="light"
              className="featured-listings-arrow"
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
    </section>
  );
}

export default FeaturedListings;
