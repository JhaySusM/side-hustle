"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dropdown, DropdownToggle, DropdownMenu } from "reactstrap";
import HeroSearchBar from "@/components/HeroSearchBar";
import { CATEGORY_CATALOG } from "@/lib/category-catalog";

const NEW_CATEGORY_ICONS = {
  "Mobiles & tablets": "/img/category/new_category/Mobiles.png",
  "Cars": "/img/category/new_category/Vehicles.png",
  "Property": "/img/category/new_category/Property_For_Sale.png",
  "Furniture & home": "/img/category/new_category/Furniture.png",
  "Services": "/img/category/new_category/Service.png",
  "Fashion & beauty": "/img/category/new_category/Fashion.png",
};

const QUICK_CATEGORIES = CATEGORY_CATALOG.map((item) => ({
  label: item.display_name,
  category: item.category_name,
  icon: NEW_CATEGORY_ICONS[item.category_name] || item.image_url,
}));

function AllCategoriesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryPillsRow({ activeCategory, activeSubcategory, onPick, className = "", allLabel = "All Categories" }) {
  const scrollRef = useRef(null);
  const dragRef = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  function handlePointerDown(e) {
    if (e.pointerType === "touch") return;
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { isDown: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false };
  }

  function handlePointerMove(e) {
    const state = dragRef.current;
    if (!state.isDown) return;
    const el = scrollRef.current;
    if (!el) return;
    const delta = e.clientX - state.startX;
    if (Math.abs(delta) > 4) state.moved = true;
    el.scrollLeft = state.scrollLeft - delta;
  }

  function handlePointerEnd() {
    dragRef.current.isDown = false;
  }

  function handleCategoryClick(category) {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    onPick(category);
  }

  function handleMegaMenuSelect(category, subcategory = "") {
    setMegaMenuOpen(false);
    onPick(category, subcategory);
  }

  return (
    <div className={`hero-category-pills ${className}`.trim()}>
      <Dropdown
        isOpen={megaMenuOpen}
        toggle={() => setMegaMenuOpen((open) => !open)}
        className="hero-category-dropdown"
      >
        <DropdownToggle
          tag="div"
          role="button"
          tabIndex={0}
          className={`hero-category-pill${!activeCategory ? " hero-category-pill-active" : ""}`}
        >
          <span className="hero-category-pill-icon">
            <AllCategoriesIcon />
          </span>
          {allLabel}
          <span className="hero-category-pill-caret">▾</span>
        </DropdownToggle>
        <DropdownMenu className="hero-mega-menu">
          <button
            type="button"
            className="hero-mega-menu-clear"
            onClick={() => handleMegaMenuSelect("")}
          >
            All Categories
          </button>
          <div className="hero-mega-menu-grid">
            {CATEGORY_CATALOG.map((item) => (
              <div key={item.key} className="hero-mega-menu-column">
                <button
                  type="button"
                  className={`hero-mega-menu-heading${activeCategory === item.category_name && !activeSubcategory ? " hero-mega-menu-active" : ""}`}
                  onClick={() => handleMegaMenuSelect(item.category_name)}
                >
                  {item.display_name}
                </button>
                <ul className="hero-mega-menu-list">
                  {item.subcategories.map((sub) => (
                    <li key={sub}>
                      <button
                        type="button"
                        className={`hero-mega-menu-link${activeCategory === item.category_name && activeSubcategory === sub ? " hero-mega-menu-active" : ""}`}
                        onClick={() => handleMegaMenuSelect(item.category_name, sub)}
                      >
                        {sub}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DropdownMenu>
      </Dropdown>
      <div
        ref={scrollRef}
        className="hero-category-pills-scroll"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {QUICK_CATEGORIES.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`hero-category-pill${activeCategory === item.category ? " hero-category-pill-active" : ""}`}
            onClick={() => handleCategoryClick(item.category)}
          >
            <span className="hero-category-pill-icon">
              <Image src={item.icon} alt="" width={20} height={20} draggable={false} />
            </span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Hero({
  activeCategory = "",
  activeSubcategory = "",
  onSelectCategory,
  onSearch,
  onLocationChange,
}) {
  const router = useRouter();

  function selectCategory(category, subcategory = "") {
    if (onSelectCategory) {
      onSelectCategory(category, subcategory);
      return;
    }
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (subcategory) params.set("subcategory", subcategory);
    router.push(params.toString() ? `/listings?${params.toString()}` : "/listings");
  }

  return (
    <section id="home" className="hero-market-shell">
      <div className="container">
        <div className="hero-desktop-pane">
          <HeroSearchBar />

          <CategoryPillsRow
            activeCategory={activeCategory}
            activeSubcategory={activeSubcategory}
            onPick={selectCategory}
          />

          <div className="hero-banner-card">
            <Image
              src="/img/banner/Top banner 1.png"
              alt="Marketplace banner"
              width={1180}
              height={320}
              priority
              className="hero-banner-image"
            />
          </div>
        </div>

        <div className="hero-mobile-pane">
          <HeroSearchBar mobileTeal onSearch={onSearch} onLocationChange={onLocationChange} />
          <div className="hero-mobile-teal-spacer" aria-hidden="true" />
          <div className="hero-mobile-category-pills-wrap">
            <CategoryPillsRow
              activeCategory={activeCategory}
              activeSubcategory={activeSubcategory}
              onPick={selectCategory}
              allLabel="All"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
