"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card, CardBody, CardTitle, CardText,
  Button, Alert,
} from "reactstrap";
import { HIDDEN_CATEGORY_NAMES, normalizeCategoryName } from "@/lib/category-catalog";
import FavoriteButton from "@/components/FavoriteButton";
import ProductQuickViewModal from "@/components/ProductQuickViewModal";
import { useIsMobile } from "@/lib/useIsMobile";
import { formatDisplayCurrency } from "@/lib/currency";

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

function FeaturedListings({ filter, subcategoryFilter, locationFilter, search = "" }) {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [favoriteError, setFavoriteError] = useState("");
  const [favoritePendingId, setFavoritePendingId] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [quickViewId, setQuickViewId] = useState(null);
  const isMobile = useIsMobile();
  const pageSize = 5;
  const scrollRef = useRef(null);
  const normalizedSearch = search.trim();
  const isGroupedHome = !filter && !subcategoryFilter && !normalizedSearch && !locationFilter;
  const requestPage = isGroupedHome ? 1 : page;
  const requestPageSize = isGroupedHome ? 50 : pageSize;

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

        if (subcategoryFilter) {
          params.set("subcategory", subcategoryFilter);
        }

        if (normalizedSearch) {
          params.set("q", normalizedSearch);
        }

        if (locationFilter) {
          params.set("location", locationFilter);
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
  }, [filter, subcategoryFilter, locationFilter, normalizedSearch, requestPage, requestPageSize]);

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
  const groupedSource = isGroupedHome
    ? displayed.filter((item) => !HIDDEN_CATEGORY_NAMES.has(item.category?.category_name || ""))
    : displayed;
  const groupedListings = Object.entries(
    groupedSource.reduce((accumulator, item, index) => {
      const categoryName = item.category?.category_name || "General";
      if (!accumulator[categoryName]) {
        accumulator[categoryName] = { items: [], firstIndex: index };
      }
      accumulator[categoryName].items.push(item);
      return accumulator;
    }, {})
  )
    .sort((left, right) => {
      const countDiff = right[1].items.length - left[1].items.length;
      if (countDiff !== 0) {
        return countDiff;
      }

      return left[1].firstIndex - right[1].firstIndex;
    })
    .slice(0, 2);
  const mobileHomeListings = groupedSource.slice(0, 4);
  const normalizedFilter = normalizeCategoryName(filter || "");

  const heading = normalizedSearch
    ? locationFilter
      ? `Results for "${normalizedSearch}" in ${locationFilter}`
      : `Results for "${normalizedSearch}"`
    : normalizedFilter && subcategoryFilter
    ? `${normalizedFilter} – ${subcategoryFilter} Listings`
    : normalizedFilter
    ? `${normalizedFilter} Listings`
    : locationFilter
    ? `Ads in ${locationFilter}`
    : "Featured Listings";

  function openListingsPage() {
    const params = new URLSearchParams();
    if (filter) {
      params.set("category", filter);
    }
    if (subcategoryFilter) {
      params.set("subcategory", subcategoryFilter);
    }
    if (locationFilter) {
      params.set("location", locationFilter);
    }
    if (normalizedSearch) {
      params.set("q", normalizedSearch);
    }

    const target = params.toString() ? `/listings?${params.toString()}` : "/listings";
    router.push(target);
  }

  function openCategoryListings(categoryName) {
    const params = new URLSearchParams({ category: categoryName });
    router.push(`/listings?${params.toString()}`);
  }

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
    setListings((current) => current.map((listing) => (
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
      setListings((current) => current.map((listing) => (
        listing.id === item.id ? { ...listing, isFavorited: item.isFavorited } : listing
      )));
      setFavoriteError(toggleError.message || "Failed to update favorites.");
    } finally {
      setFavoritePendingId(null);
    }
  }

  function renderListingCard(item, options = {}) {
    const compact = Boolean(options.compact);
    const mobileHome = Boolean(options.mobileHome);
    const isOwnListing = viewer?.id === item.user?.id;

    return (
      <div
        key={item.id}
        className={`featured-listings-card${compact ? " featured-listings-card-compact" : ""}${mobileHome ? " featured-listings-card-mobile-home" : ""}`}
        style={compact || mobileHome ? undefined : { minWidth: 220, maxWidth: 220, flexShrink: 0 }}
      >
        <Card
          className={`h-100 shadow-sm d-flex flex-column${mobileHome ? " featured-listings-mobile-card" : ""}`}
          style={{ cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
          onClick={() => { if (isMobile) { setQuickViewId(item.id); } else { router.push(`/product/${item.id}`); } }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
        >
          <div className="product-tile-image-wrap">
            <ListingImage
              src={item.image}
              alt={item.product_name}
              style={mobileHome ? { width: "100%", height: 156, objectFit: "cover" } : compact ? { width: "100%", height: 150, objectFit: "cover" } : undefined}
            />
            <FavoriteButton
              className="product-tile-favorite-btn"
              isFavorited={Boolean(item.isFavorited)}
              iconOnly
              disabled={favoritePendingId === item.id || isOwnListing}
              title={isOwnListing ? "You cannot favorite your own listing" : undefined}
              onClick={(event) => handleFavoriteToggle(event, item)}
            />
          </div>
          <CardBody className={`d-flex flex-column${mobileHome ? " featured-listings-mobile-card-body" : ""}`}>
            <CardText className="product-tile-price mb-0">{formatDisplayCurrency(item.price)}</CardText>
            <CardTitle tag="h6" className="product-tile-title mb-0">{item.product_name}</CardTitle>
            <div className="product-tile-meta-row">
              {item.user?.city ? (
                <span className="product-tile-location">
                  <LocationPinIcon />
                  <span>{item.user.city}</span>
                </span>
              ) : <span />}
              <span className="product-tile-date">{formatPostedDate(item.upload_date_time)}</span>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <>
    <section className="container py-4">
      {!isGroupedHome ? (
        <p className="text-muted small mb-3">{heading}</p>
      ) : null}
      {favoriteError ? <Alert color="danger" className="mb-3">{favoriteError}</Alert> : null}
      {displayed.length === 0 ? (
        <div className="text-muted py-4 text-center border rounded-3">
          {normalizedSearch
            ? locationFilter
              ? `No listings found for "${normalizedSearch}" in ${locationFilter}.`
              : `No listings found for "${normalizedSearch}".`
            : filter && subcategoryFilter
            ? `No listings found in "${filter} – ${subcategoryFilter}" yet.`
            : filter
            ? `No listings found in "${filter}" yet.`
            : locationFilter
            ? `No listings found in "${locationFilter}" yet.`
            : "No listings yet. Be the first to post an ad!"}
        </div>
      ) : isGroupedHome ? (
        <div className="featured-category-list">
          <div className="featured-mobile-home-shell">
            <div className="featured-mid-banner featured-mobile-home-banner">
              <Image
                src="/img/banner/mobile_view/mid_banner_mobile.png"
                alt="Post your first ad"
                width={1180}
                height={220}
                className="featured-mid-banner-image"
              />
            </div>

            <div className="featured-category-header featured-mobile-home-header">
              <h4 className="featured-category-title featured-mobile-home-title">Recently viewed</h4>
              <button
                type="button"
                className="featured-category-link featured-mobile-home-link"
                onClick={openListingsPage}
              >
                View More
              </button>
            </div>

            <div className="featured-mobile-home-grid">
              {mobileHomeListings.map((item) => renderListingCard(item, { mobileHome: true }))}
            </div>
          </div>

          {groupedListings.map(([categoryName, metadata], index) => (
            <div key={categoryName}>
              <div className="featured-category-section">
                <div className="featured-category-header">
                  <h4 className="featured-category-title">More in {categoryName} for Sale</h4>
                  <button
                    type="button"
                    className="featured-category-link"
                    onClick={() => openCategoryListings(categoryName)}
                  >
                    View More
                  </button>
                </div>
                <div className="featured-category-grid listings-scroll">
                  {metadata.items.slice(0, 4).map((item) => renderListingCard(item, { compact: true }))}
                </div>
              </div>

              {index === 0 && groupedListings.length > 1 ? (
                <div className="featured-mid-banner">
                  <Image
                    src="/img/banner/mid_banner.png"
                    alt="Post your first ad"
                    width={1180}
                    height={220}
                    className="featured-mid-banner-image"
                  />
                </div>
              ) : null}
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

    </section>
      <ProductQuickViewModal
        productId={quickViewId}
        isOpen={Boolean(quickViewId)}
        onClose={() => setQuickViewId(null)}
        viewer={viewer}
      />
    </>
  );
}

export default FeaturedListings;
