"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardText,
  Col,
  Container,
  Row,
  Spinner,
} from "reactstrap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FavoriteButton from "@/components/FavoriteButton";
import ProductQuickViewModal from "@/components/ProductQuickViewModal";
import { useIsMobile } from "@/lib/useIsMobile";
import { formatDisplayCurrency } from "@/lib/currency";

const FALLBACK_IMG = "https://placehold.co/640x420?text=No+Image";

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

function ListingImage({ src, alt }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMG);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(FALLBACK_IMG)}
      className="listing-browser-image"
    />
  );
}

function formatDate(value) {
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

export default function ListingsPageClient({ initialQuery, initialCategory, initialSubcategory, initialLocation }) {
  const router = useRouter();

  const [query] = useState(initialQuery);
  const [category] = useState(initialCategory);
  const [subcategory] = useState(initialSubcategory);
  const [location] = useState(initialLocation);
  const [items, setItems] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [quickViewId, setQuickViewId] = useState(null);
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [favoriteError, setFavoriteError] = useState("");
  const [favoritePendingId, setFavoritePendingId] = useState(null);

  const sentinelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

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

    loadViewer();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      if (page === 1) {
        setInitialLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "12",
        });

        if (query.trim()) {
          params.set("q", query.trim());
        }

        if (category.trim()) {
          params.set("category", category.trim());
        }

        if (subcategory.trim()) {
          params.set("subcategory", subcategory.trim());
        }

        if (location.trim()) {
          params.set("location", location.trim());
        }

        const response = await fetch(`/api/products/active?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch listings.");
        }

        setItems((current) => {
          if (page === 1) {
            return data.products || [];
          }

          const seen = new Set(current.map((item) => item.id));
          const next = [...current];

          for (const item of data.products || []) {
            if (!seen.has(item.id)) {
              next.push(item);
            }
          }

          return next;
        });
        setTotal(data.total || 0);
        setHasMore(Boolean(data.hasMore));
        setError("");
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Failed to fetch listings.");
          setHasMore(false);
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
          setLoadingMore(false);
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [page, query, category, subcategory, location]);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node || !hasMore || initialLoading || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setPage((current) => current + 1);
        }
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, initialLoading, loadingMore]);

  async function handleFavoriteToggle(event, item) {
    event.stopPropagation();
    setFavoriteError("");

    if (!viewer) {
      setFavoriteError("Please sign in to save listings to your favorites.");
      return;
    }

    if (viewer.id === item.user?.id) {
      setFavoriteError("You cannot favorite your own listing.");
      return;
    }

    const nextFavorited = !item.isFavorited;
    setFavoritePendingId(item.id);
    setItems((current) => current.map((listing) => (
      listing.id === item.id ? { ...listing, isFavorited: nextFavorited } : listing
    )));

    try {
      const response = await fetch("/api/favorites", {
        method: nextFavorited ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update favorites.");
      }
    } catch (toggleError) {
      setItems((current) => current.map((listing) => (
        listing.id === item.id ? { ...listing, isFavorited: item.isFavorited } : listing
      )));
      setFavoriteError(toggleError.message || "Failed to update favorites.");
    } finally {
      setFavoritePendingId(null);
    }
  }

  return (
    <div className="listing-browser-page">
      <Navbar />
      <section className="pb-5">
        <Container>
          <div className="listing-browser-toolbar">
            <div>
              <h2 className="listing-browser-results-title">Fresh listings</h2>
              <p className="listing-browser-results-copy">
                {total > 0 ? `${total} active ads found` : "Active ads will appear here as sellers post them."}
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {query ? <Badge pill className="listing-browser-chip">Search: {query}</Badge> : null}
              {location ? <Badge pill className="listing-browser-chip">Location: {location}</Badge> : null}
              {category ? (
                <Badge pill className="listing-browser-chip-button">
                  Category: {category}
                </Badge>
              ) : null}
              {subcategory ? (
                <Badge pill className="listing-browser-chip-button">
                  Subcategory: {subcategory}
                </Badge>
              ) : null}
            </div>
          </div>

          {error ? <Alert color="danger">{error}</Alert> : null}
          {favoriteError ? <Alert color="danger">{favoriteError}</Alert> : null}

          {initialLoading ? (
            <div className="listing-browser-loader-block">
              <Spinner color="primary" />
              <p className="mb-0 text-muted">Loading listings...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="listing-browser-empty">
              <h3>No listings match that search yet.</h3>
              <p>Try a broader keyword or remove the current category filter.</p>
            </div>
          ) : (
            <>
              <Row className="g-4">
                {items.map((item) => (
                  <Col key={item.id} md={6} xl={4}>
                    <Card
                      className="listing-browser-card h-100 border-0"
                      role="button"
                      onClick={() => { if (isMobile) { setQuickViewId(item.id); } else { router.push(`/product/${item.id}`); } }}
                    >
                      <div className="product-tile-image-wrap">
                        <ListingImage src={item.image} alt={item.product_name} />
                        <FavoriteButton
                          className="product-tile-favorite-btn"
                          isFavorited={Boolean(item.isFavorited)}
                          iconOnly
                          disabled={favoritePendingId === item.id || viewer?.id === item.user?.id}
                          title={viewer?.id === item.user?.id ? "You cannot favorite your own listing" : undefined}
                          onClick={(event) => handleFavoriteToggle(event, item)}
                        />
                      </div>
                      <CardBody className="d-flex flex-column gap-2">
                        <CardText className="product-tile-price mb-0">
                          {formatDisplayCurrency(item.price)}
                        </CardText>
                        <h3 className="product-tile-title mb-0">{item.product_name}</h3>

                        <div className="product-tile-meta-row mt-auto">
                          {item.user?.city ? (
                            <span className="product-tile-location">
                              <LocationPinIcon />
                              <span>{item.user.city}</span>
                            </span>
                          ) : <span />}
                          <span className="product-tile-date">{formatDate(item.upload_date_time)}</span>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                ))}
              </Row>

              <div ref={sentinelRef} className="listing-browser-sentinel">
                {loadingMore ? (
                  <div className="listing-browser-loader-inline">
                    <Spinner size="sm" color="primary" />
                    <span>Loading more listings...</span>
                  </div>
                ) : hasMore ? (
                  <span>Keep scrolling to load more.</span>
                ) : (
                  <span>You have reached the end of the listings.</span>
                )}
              </div>
            </>
          )}
        </Container>
      </section>

      <Footer />

      <ProductQuickViewModal
        productId={quickViewId}
        isOpen={Boolean(quickViewId)}
        onClose={() => setQuickViewId(null)}
        viewer={viewer}
      />
    </div>
  );
}