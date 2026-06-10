"use client";
import { useEffect, useState } from "react";
import { Button } from "reactstrap";
import Image from "next/image";
import AuthModal from "./AuthModal";
import { usePathname, useRouter } from "next/navigation";

const MOBILE_LINKS = ["How It Works?", "Popular Categories", "Trending Searches", "About Us", "TradiGo"];

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

  const showMobileHome = pathname === "/" && isMobile;

  return (
    <section id="about" className="container py-4 py-md-5">
      {showMobileHome ? (
        <div className="cta-mobile-shell">
          {MOBILE_LINKS.map((item) => (
            <button key={item} type="button" className="cta-mobile-link-row">
              <span>{item}</span>
              <span className="cta-mobile-link-arrow" aria-hidden="true">›</span>
            </button>
          ))}

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
