"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import HeroSearchBar from "@/components/HeroSearchBar";

const QUICK_CATEGORIES = [
  { label: "Mobile", category: "Electronics" },
  { label: "Cars", category: "Vehicles" },
  { label: "Property", category: "Property" },
  { label: "Clothes", category: "Clothes" },
  { label: "Tools", category: "Tools" },
  { label: "Furniture", category: "Furniture" },
];

function HeartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21.35 10.55 20C5.4 15.24 2 12.09 2 8.25 2 5.1 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.1 22 8.25c0 3.84-3.4 6.99-8.55 11.76L12 21.35Z" />
    </svg>
  );
}

export default function Hero() {
  const router = useRouter();

  return (
    <section id="home" className="hero-market-shell">
      <div className="container">
        <div className="hero-desktop-pane">
          <HeroSearchBar />

          <div className="hero-top-links">
            <button type="button" className="hero-top-link hero-top-link-strong">
              All Categories
              <span className="hero-top-link-caret">▾</span>
            </button>
            {QUICK_CATEGORIES.map((item) => (
              <button
                key={item.label}
                type="button"
                className="hero-top-link"
                onClick={() => router.push(`/listings?category=${encodeURIComponent(item.category)}`)}
              >
                {item.label}
              </button>
            ))}
          </div>

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
          <div className="hero-mobile-banner-card">
            <Image
              src="/img/banner/mobile_view/top_banner.png"
              alt="Marketplace banner"
              width={860}
              height={980}
              priority
              className="hero-mobile-banner-image"
            />

            <div className="hero-mobile-overlay">
              <HeroSearchBar homepage />
              <button
                type="button"
                className="hero-mobile-favorites"
                aria-label="Open favorites"
                onClick={() => router.push("/favorites")}
              >
                <HeartIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
