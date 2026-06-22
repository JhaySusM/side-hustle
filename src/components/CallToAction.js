"use client";
import { useEffect, useState } from "react";
import { Button } from "reactstrap";
import Image from "next/image";
import AuthModal from "./AuthModal";
import { usePathname, useRouter } from "next/navigation";

const MOBILE_SECTIONS = [
  {
    label: "How It Works?",
    type: "steps",
    items: [
      { title: "Post Your Ad", description: "Add photos, choose a price, and publish your listing in a few taps." },
      { title: "Chat with Buyers", description: "Reply in real time, answer questions, and negotiate inside the app." },
      { title: "Close the Deal", description: "Meet locally, confirm the details, and complete the sale with confidence." },
    ],
  },
  {
    label: "Popular Categories",
    type: "chips",
    items: ["Cars", "Flats for rent", "Mobile Phones", "Jobs", "Furniture", "Electronics"],
  },
  {
    label: "Trending Searches",
    type: "chips",
    items: ["Mobile Phones", "Cars", "Property", "Tools", "Clothes", "Sofas"],
  },
  {
    label: "About Us",
    type: "copy",
    body: "TradiGo is a local marketplace built to help buyers and sellers connect quickly, chat directly, and arrange deals in their area.",
  },
  {
    label: "TradiGo",
    type: "facts",
    items: [
      "Browse fresh listings across Pakistan.",
      "Chat with buyers and sellers in real time.",
      "Post ads for free and manage them from your account.",
    ],
  },
];

export default function CallToAction() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedUser = localStorage.getItem("batjee_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [openSectionLabel, setOpenSectionLabel] = useState("");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 575.98px)");

    function syncViewport() {
      setIsMobile(mediaQuery.matches);
    }

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  function handleClick() {
    if (user) {
      router.push("/post");
    } else {
      setAuthOpen(true);
    }
  }

  function toggleMobileSection(label) {
    setOpenSectionLabel((currentLabel) => (currentLabel === label ? "" : label));
  }

  const showMobileHome = pathname === "/" && isMobile;

  return (
    <section id="about-us" className="container py-4 py-md-5">
      {showMobileHome ? (
        <div className="cta-mobile-shell">
          {MOBILE_SECTIONS.map((section) => {
            const isOpen = openSectionLabel === section.label;

            return (
              <div key={section.label} className={`cta-mobile-accordion-item${isOpen ? " is-open" : ""}`}>
                <button
                  type="button"
                  className="cta-mobile-link-row"
                  onClick={() => toggleMobileSection(section.label)}
                  aria-expanded={isOpen}
                >
                  <span>{section.label}</span>
                  <span className="cta-mobile-link-arrow" aria-hidden="true">›</span>
                </button>

                {isOpen ? (
                  <div className="cta-mobile-link-panel">
                    {section.type === "steps" ? (
                      <div className="cta-mobile-step-list">
                        {section.items.map((item) => (
                          <div key={item.title} className="cta-mobile-step-card">
                            <div className="cta-mobile-step-title">{item.title}</div>
                            <div className="cta-mobile-step-copy">{item.description}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {section.type === "chips" ? (
                      <div className="cta-mobile-chip-list">
                        {section.items.map((item) => (
                          <span key={item} className="cta-mobile-chip">{item}</span>
                        ))}
                      </div>
                    ) : null}

                    {section.type === "copy" ? (
                      <p className="cta-mobile-copy mb-0">{section.body}</p>
                    ) : null}

                    {section.type === "facts" ? (
                      <div className="cta-mobile-fact-list">
                        {section.items.map((item) => (
                          <div key={item} className="cta-mobile-fact-item">{item}</div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="cta-app-banner cta-mobile-app-banner">
            <Image
              src="/img/banner/buttom_banner.png"
              alt="Download TradiGo Today"
              width={1180}
              height={240}
              className="cta-app-image"
            />
          </div>
        </div>
      ) : null}

      {!showMobileHome ? (
        <div className="cta-promo-stack">
        <div className="cta-sell-card">
          <div className="cta-sell-copy">
            <h3 className="cta-sell-title">Ready to Start Selling?</h3>
            <p className="cta-sell-text">Join thousands of sellers on TradiGo.com and reach buyers in your area today.</p>
            <Button className="cta-sell-button" onClick={handleClick}>
              Post your Ad- Free
            </Button>
          </div>
          <div className="cta-sell-banner">
            <Image
              src="/img/banner/shop_banner.png"
              alt="Shopping online banner"
              width={520}
              height={220}
              className="cta-sell-image"
            />
          </div>
        </div>

        <div className="cta-app-banner">
          <Image
            src="/img/banner/buttom_banner.png"
            alt="Download TradiGo Today"
            width={1180}
            height={240}
            className="cta-app-image"
          />
        </div>
        </div>
      ) : null}

      <AuthModal
        isOpen={authOpen}
        toggle={() => setAuthOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
        onLoginSuccess={() => {
          setAuthOpen(false);
          router.push("/post");
        }}
      />
    </section>
  );
}
