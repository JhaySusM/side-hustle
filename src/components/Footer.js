"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Row, Col } from "reactstrap";
import { fetchInbox, subscribeToInbox } from "@/lib/message-client";
import AuthModal from "@/components/AuthModal";

const POPULAR_CATEGORIES = ["Cars", "Property", "Mobiles & tablets", "Jobs & careers"];

const FOOTER_LINKS = [
  { label: "Home", href: "/#home" },
  { label: "Marketplace", href: "/#marketplace" },
  { label: "About Us", href: "/#about" },
  { label: "Contact", href: "/#contact" },
  { label: "Terms", href: "#" },
  { label: "Privacy", href: "#" },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "#", icon: "/img/socmed/IG icon.png" },
  { label: "Facebook", href: "#", icon: "/img/socmed/FB icon.png" },
  { label: "X", href: "#", icon: "/img/socmed/X icon.png" },
  { label: "Email", href: "#", icon: "/img/socmed/Email icon.png" },
];

const MOBILE_NAV_LINKS = [
  { label: "Home", href: "/", icon: "/img/mobile/Home Icon.png" },
  { label: "Saved", href: "/dashboard#favorites", iconType: "heart" },
  { label: "Sell", href: "/post", icon: "+", accent: true },
  { label: "Chat", href: "/messages", icon: "/img/mobile/Chat Icon.png" },
  { label: "Acc", href: "/dashboard", icon: "/img/mobile/Acc Icon.png" },
];

function HeartNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" aria-hidden="true">
      <path d="M12 20.25c-.21 0-.42-.07-.58-.2-4.32-3.49-7.12-5.96-8.56-7.56C1.62 11.11 1 9.7 1 8.25 1 5.35 3.35 3 6.25 3c1.69 0 3.31.79 4.35 2.13A5.57 5.57 0 0 1 14.95 3c2.9 0 5.25 2.35 5.25 5.25 0 1.45-.62 2.86-1.86 4.24-1.44 1.6-4.24 4.07-8.56 7.56-.16.13-.37.2-.58.2Z" />
    </svg>
  );
}

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [authRedirectPath, setAuthRedirectPath] = useState("/dashboard");

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

  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 900);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();

        if (cancelled) {
          return;
        }

        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
          setUnreadCount(0);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setUnreadCount(0);
        }
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    async function syncUnread() {
      try {
        const inbox = await fetchInbox();
        setUnreadCount(inbox.unreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    }

    syncUnread();

    return subscribeToInbox(() => {
      syncUnread();
    });
  }, [user]);

  function handleBackToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleMobileNavClick(event, item) {
    const requiresAuth = item.label === "Acc" || item.label === "Saved" || item.label === "Chat" || item.label === "Sell";

    if (!requiresAuth || user) {
      return;
    }

    event.preventDefault();
    setAuthRedirectPath(item.href || "/dashboard");
    setAuthOpen(true);
  }

  const showMobileFooter = isMobile;
  const hideMobileMarketingFooter = pathname === "/messages" || pathname.startsWith("/messages/");

  return (
    <>
      {showBackToTop && !showMobileFooter ? (
        <button type="button" className="footer-back-to-top footer-back-to-top-floating" onClick={handleBackToTop}>
          <span className="footer-back-to-top-icon" aria-hidden="true">⌃</span>
          <span>Back to top</span>
        </button>
      ) : null}

      {showMobileFooter && !hideMobileMarketingFooter ? (
        <footer className="footer-mobile-home">
          <div className="footer-mobile-home-socials">
            {SOCIAL_LINKS.map((item) => (
              <a key={`mobile-${item.label}`} href={item.href} className="footer-mobile-home-social-link" aria-label={item.label}>
                <Image src={item.icon} alt={item.label} width={42} height={42} className="footer-mobile-home-social-icon" />
              </a>
            ))}
          </div>
          <div className="footer-mobile-home-copy">Classified in Pakistan. @ 2026 TradiGo</div>
        </footer>
      ) : null}

      {!showMobileFooter ? (
        <footer id="contact" className={`footer footer-tradigo py-5 mt-5${pathname === "/" ? " footer-tradigo-home" : ""}`}>
        <div className="container">
        <Row className="g-4 footer-tradigo-grid">
          <Col md={4} lg={4} className="mb-3 footer-tradigo-column">
            <h5 className="footer-tradigo-heading">Popular Categories</h5>
            <div className="footer-tradigo-list">
              {POPULAR_CATEGORIES.map((item) => (
                <a key={item} href="/listings" className="footer-tradigo-link">{item}</a>
              ))}
            </div>
          </Col>
          <Col md={4} lg={4} className="mb-3 footer-tradigo-column footer-tradigo-column-center">
            <h5 className="footer-tradigo-heading">TradiGo</h5>
            <div className="footer-tradigo-links-inline">
              {FOOTER_LINKS.map((item) => (
                <a key={item.label} href={item.href} className="footer-tradigo-link-inline">{item.label}</a>
              ))}
            </div>
          </Col>
          <Col md={4} lg={4} className="mb-3 footer-tradigo-column footer-tradigo-column-right">
            <h5 className="footer-tradigo-heading">Follow Us</h5>
            <div className="footer-tradigo-socials">
              {SOCIAL_LINKS.map((item) => (
                <a key={item.label} href={item.href} className="footer-tradigo-social-link" aria-label={item.label}>
                  <Image src={item.icon} alt={item.label} width={38} height={38} className="footer-tradigo-social-icon" />
                </a>
              ))}
            </div>
          </Col>
        </Row>
        <div className="text-center mt-4 footer-tradigo-copy">
          <small>© 2026 TradiGo.com — All rights reserved.</small>
        </div>
        </div>
        </footer>
      ) : null}

      {showMobileFooter ? (
        <nav className="footer-mobile-bottom-nav" aria-label="Primary">
          {MOBILE_NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`footer-mobile-bottom-link${item.accent ? " footer-mobile-bottom-link-accent" : ""}`}
              onClick={(event) => handleMobileNavClick(event, item)}
            >
              <span className="footer-mobile-bottom-icon" aria-hidden="true">
                {item.accent ? item.icon : item.iconType === "heart" ? (
                  <HeartNavIcon />
                ) : (
                  <Image
                    src={item.icon}
                    alt=""
                    width={22}
                    height={22}
                    className="footer-mobile-bottom-icon-image"
                  />
                )}
                {item.label === "Chat" && unreadCount > 0 ? (
                  <span className="footer-mobile-bottom-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                ) : null}
              </span>
              <span className="footer-mobile-bottom-label">{item.label}</span>
            </a>
          ))}
        </nav>
      ) : null}

      <AuthModal
        isOpen={authOpen}
        toggle={() => setAuthOpen(false)}
        onAuthSuccess={(nextUser) => setUser(nextUser)}
        onLoginSuccess={(nextUser) => {
          setUser(nextUser);
          router.push(authRedirectPath || "/dashboard");
        }}
      />
    </>
  );
}
