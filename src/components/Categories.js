"use client";
import { Row, Col } from "reactstrap";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Categories() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [activePage, setActivePage] = useState(0);
  const mobileTrackRef = useRef(null);

  const categoryPages = useMemo(() => {
    const pages = [];

    for (let index = 0; index < categories.length; index += 8) {
      pages.push(categories.slice(index, index + 8));
    }

    return pages;
  }, [categories]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories?includeCatalog=1");
        const data = await res.json();
        if (res.ok && data.categories) {
          setCategories(data.categories);
          setActivePage(0);
        }
      } catch {}
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    if (mobileTrackRef.current) {
      mobileTrackRef.current.scrollLeft = 0;
    }
  }, [categoryPages.length]);

  function handleMobileScroll(event) {
    const { scrollLeft, clientWidth } = event.currentTarget;

    if (!clientWidth) {
      return;
    }

    setActivePage(Math.round(scrollLeft / clientWidth));
  }

  function scrollToPage(pageIndex) {
    const track = mobileTrackRef.current;

    if (!track) {
      return;
    }

    track.scrollTo({
      left: track.clientWidth * pageIndex,
      behavior: "smooth",
    });
    setActivePage(pageIndex);
  }

  return (
    <section id="marketplace" className="container py-4 categories-panel">
      <h3 className="fw-bold mb-3">Browse Categories</h3>
      <div
        ref={mobileTrackRef}
        className="categories-mobile-track"
        aria-label="Browse categories"
        onScroll={handleMobileScroll}
      >
        {categoryPages.map((page, pageIndex) => (
          <div key={`mobile-page-${pageIndex}`} className="categories-mobile-page">
            <div className="categories-mobile-grid">
              {page.map((cat) => (
                <button
                  key={`mobile-${cat.id}`}
                  type="button"
                  onClick={() => router.push(`/listings?category=${encodeURIComponent(cat.category_name)}`)}
                  className="category-mobile-tile"
                  aria-label={cat.display_name || cat.category_name}
                >
                  <Image
                    src={cat.image_url}
                    width={72}
                    height={72}
                    alt={cat.display_name || cat.category_name}
                    className="category-mobile-icon-image"
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="categories-mobile-dots" aria-hidden="true">
        {categoryPages.map((_, pageIndex) => (
          <button
            key={`mobile-dot-${pageIndex}`}
            type="button"
            className={`categories-mobile-dot${pageIndex === activePage ? " categories-mobile-dot-active" : ""}`}
            onClick={() => scrollToPage(pageIndex)}
            aria-label={`Show category page ${pageIndex + 1}`}
          />
        ))}
      </div>

      <Row className="g-2 g-md-3 justify-content-start">
        {categories.map((cat) => {
          return (
            <Col key={cat.id} xs={4} sm={3} md={2} lg={1} className="text-center">
              <div
                onClick={() => router.push(`/listings?category=${encodeURIComponent(cat.category_name)}`)}
                className="category-tile"
              >
                <div className="category-icon-frame">
                  <div className="category-icon mb-0">
                    <Image
                      src={cat.image_url}
                      width={44}
                      height={44}
                      alt={cat.display_name || cat.category_name}
                      className="category-icon-image"
                    />
                  </div>
                </div>
                <div className="category-label">
                  {cat.display_name || cat.category_name}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </section>
  );
}
