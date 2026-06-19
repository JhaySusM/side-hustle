"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Navbar as RSNavbar,
  NavbarBrand,
  Collapse,
  Nav,
  NavItem,
  NavLink,
  Button,
  Container,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import AuthModal from "./AuthModal";
import { fetchInbox, subscribeToInbox } from "@/lib/message-client";
import HeroSearchBar from "@/components/HeroSearchBar";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [referralParam, setReferralParam] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const nextReferral = String(params.get("ref") || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 24);

    setReferralParam(nextReferral);
  }, [pathname]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (!authChecked || user || !referralParam) {
      return;
    }

    setAuthOpen(true);
  }, [authChecked, referralParam, user]);

  useEffect(() => {
    if (!user) return;
    async function calcUnread() {
      try {
        const inbox = await fetchInbox();
        setUnreadCount(inbox.unreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    }

    calcUnread();

    return subscribeToInbox(() => {
      calcUnread();
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setNotificationUnreadCount(0);
      return;
    }

    let cancelled = false;

    async function loadNotifications() {
      setNotificationLoading(true);
      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch notifications");
        }

        if (!cancelled) {
          setNotifications(data.notifications || []);
          setNotificationUnreadCount(Number(data.unreadCount || 0));
        }
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setNotificationUnreadCount(0);
        }
      } finally {
        if (!cancelled) {
          setNotificationLoading(false);
        }
      }
    }

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 45000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [user]);

  function relativeTime(value) {
    const ts = value ? new Date(value).getTime() : NaN;
    if (!Number.isFinite(ts)) return "just now";

    const diff = Date.now() - ts;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < hour) {
      return `${Math.max(1, Math.round(diff / minute))}m ago`;
    }

    if (diff < day) {
      return `${Math.round(diff / hour)}h ago`;
    }

    return `${Math.round(diff / day)}d ago`;
  }

  async function refreshNotifications() {
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notifications");
      }

      setNotifications(data.notifications || []);
      setNotificationUnreadCount(Number(data.unreadCount || 0));
    } catch {
      setNotifications([]);
      setNotificationUnreadCount(0);
    }
  }

  async function markNotificationRead(notification) {
    if (!notification || notification.isRead) {
      return;
    }

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notificationId: notification.id }),
      });
      await refreshNotifications();
    } catch {
      // Ignore passive failures and keep local state.
    }
  }

  async function markAllNotificationsRead() {
    if (!notificationUnreadCount) {
      return;
    }

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ markAll: true }),
      });
      await refreshNotifications();
    } catch {
      // Ignore passive failures and keep local state.
    }
  }

  async function openNotification(notification) {
    await markNotificationRead(notification);
    setNotificationMenuOpen(false);

    const deepLink = String(notification?.deepLink || "").trim();

    if (deepLink) {
      if (deepLink === "home" || deepLink === "/" || deepLink === "/#home") {
        if (typeof window !== "undefined" && window.location.pathname === "/") {
          if (window.location.hash !== "#home") {
            window.location.hash = "#home";
          }
          return;
        }

        router.push("/#home");
        return;
      }

      router.push(deepLink);
      return;
    }

    router.push("/");
  }

  function handlePostClick() {
    if (!user) {
      setAuthOpen(true);
    } else {
      router.push("/post");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("batjee:logout"));
    setUser(null);
    setUnreadCount(0);
    setNotificationUnreadCount(0);
    setNotifications([]);
    router.push("/");
    setDropdownOpen(false);
    setNotificationMenuOpen(false);
    setLogoutModalOpen(false);
  }

  function openLogoutModal() {
    setDropdownOpen(false);
    setLogoutModalOpen(true);
  }

  const userAvatar = user && (
    <div style={{
      width: 32, height: 32, borderRadius: "50%", background: "#0d6efd",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 14, flexShrink: 0,
    }}>
      {user.name.charAt(0).toUpperCase()}
    </div>
  );

  const brandLogo = (
    <Image
      src="/img/header/Logo TradiGo.png"
      alt="TradiGo Logo"
      width={140}
      height={44}
      priority
      className="tradigo-navbar-logo-image"
    />
  );

  const loginButtonImage = (
    <Image
      src="/img/header/Login Button.png"
      alt="Login"
      width={92}
      height={34}
      className="tradigo-navbar-login-image"
    />
  );

  const showGlobalSearch = pathname !== "/" && !pathname.startsWith("/admin");

  return (
    <>
      <RSNavbar
        light
        expand="lg"
        className={`py-0 tradigo-navbar${pathname === "/" ? " tradigo-navbar-home" : ""}`}
        style={{
          position: "relative",
          background: "#0d1f67",
          minHeight: 42,
          boxShadow: "0 2px 8px rgba(8, 18, 58, 0.18)",
        }}
      >
        <Container className="d-flex align-items-center tradigo-navbar-container">
          <NavbarBrand href="/" className="me-3 d-flex align-items-center tradigo-navbar-brand" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {brandLogo}
          </NavbarBrand>

          <Collapse navbar className="d-none d-lg-flex flex-grow-1 justify-content-end">
            <Nav className="align-items-center me-3" navbar>
              <NavItem><NavLink href="/#home" style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.92rem" }}>Home</NavLink></NavItem>
              <NavItem><NavLink href="/#marketplace" style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.92rem" }}>Marketplace</NavLink></NavItem>
              <NavItem><NavLink href="/#about" style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.92rem" }}>About</NavLink></NavItem>
              <NavItem><NavLink href="/#contact" style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.92rem" }}>Contact</NavLink></NavItem>
            </Nav>

            {user ? (
              <div className="d-flex align-items-center gap-2">
                <Dropdown isOpen={notificationMenuOpen} toggle={() => setNotificationMenuOpen(!notificationMenuOpen)}>
                  <DropdownToggle tag="div" style={{ cursor: "pointer", position: "relative", padding: "4px 6px" }} title="Notifications">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                    {notificationUnreadCount > 0 && (
                      <span style={{
                        position: "absolute", top: 0, right: 0,
                        background: "#e53935", color: "#fff",
                        borderRadius: "50%", width: 17, height: 17,
                        fontSize: 10, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        lineHeight: 1,
                      }}>
                        {notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}
                      </span>
                    )}
                  </DropdownToggle>
                  <DropdownMenu end style={{ minWidth: 320, maxWidth: 360 }}>
                    <DropdownItem header className="d-flex justify-content-between align-items-center">
                      <span>Notifications</span>
                      {notificationUnreadCount > 0 && (
                        <span className="badge bg-danger rounded-pill">{notificationUnreadCount}</span>
                      )}
                    </DropdownItem>
                    <DropdownItem divider />
                    <div style={{ maxHeight: 340, overflowY: "auto" }}>
                      {notificationLoading ? (
                        <div className="px-3 py-2 text-muted" style={{ fontSize: 12 }}>Loading...</div>
                      ) : notifications.length ? (
                        notifications.slice(0, 8).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => openNotification(item)}
                            style={{
                              width: "100%",
                              border: "none",
                              background: item.isRead ? "#fff" : "#f5faff",
                              textAlign: "left",
                              padding: "10px 12px",
                              borderBottom: "1px solid #eef2f7",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: item.isRead ? 600 : 700, color: "#1f2937" }}>{item.title}</div>
                            <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>{item.body}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{relativeTime(item.createdAt)}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-muted" style={{ fontSize: 12 }}>No notifications yet.</div>
                      )}
                    </div>
                    <DropdownItem divider />
                    <DropdownItem onClick={markAllNotificationsRead} disabled={!notificationUnreadCount}>
                      Mark all as read
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>

                <div
                  onClick={() => router.push("/messages")}
                  style={{ position: "relative", cursor: "pointer", padding: "4px 6px" }}
                  title="Messages"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span style={{
                      position: "absolute", top: 0, right: 0,
                      background: "#e53935", color: "#fff",
                      borderRadius: "50%", width: 17, height: 17,
                      fontSize: 10, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1,
                    }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>

                <Dropdown isOpen={dropdownOpen} toggle={() => setDropdownOpen(!dropdownOpen)}>
                  <DropdownToggle tag="div" style={{ cursor: "pointer" }} className="d-flex align-items-center gap-2 border rounded-pill px-3 py-1 bg-light">
                    {userAvatar}
                    <span style={{ fontWeight: 500 }}>{user.name}</span>
                    <span style={{ fontSize: 10, color: "#888" }}>▾</span>
                  </DropdownToggle>
                  <DropdownMenu end>
                    <DropdownItem header>{user.email}</DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem onClick={() => router.push("/dashboard")}>My Dashboard</DropdownItem>
                    <DropdownItem onClick={() => router.push("/messages")}>
                      My Messages
                      {unreadCount > 0 && (
                        <span className="badge bg-danger ms-2 rounded-pill" style={{ fontSize: 11 }}>{unreadCount}</span>
                      )}
                    </DropdownItem>
                    <DropdownItem onClick={openLogoutModal}>Sign Out</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            ) : (
              <Button
                onClick={handlePostClick}
                style={{ background: "transparent", border: "none", padding: 0, whiteSpace: "nowrap" }}
              >
                {loginButtonImage}
              </Button>
            )}
          </Collapse>
        </Container>
      </RSNavbar>

      <div className="tradigo-navbar-mobile-spacer" aria-hidden="true" />

      {showGlobalSearch ? (
        <section className="pt-3 pb-2">
          <Container>
            <HeroSearchBar />
          </Container>
        </section>
      ) : null}

      <AuthModal
        isOpen={authOpen}
        toggle={() => setAuthOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
      />

      <Modal isOpen={logoutModalOpen} toggle={() => setLogoutModalOpen(false)} centered>
        <ModalBody className="p-0">
          <div className="logout-modal-panel">
            <div className="logout-modal-icon">↪</div>
            <h5 className="logout-modal-title">Sign out of your account?</h5>
            <p className="logout-modal-copy">
              You will need to sign in again to check messages, manage listings, and continue your activity.
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="border-0 pt-0 px-4 pb-4 d-flex justify-content-center gap-2">
          <Button color="light" className="logout-modal-cancel" onClick={() => setLogoutModalOpen(false)}>
            Stay signed in
          </Button>
          <Button className="logout-modal-confirm" onClick={handleLogout}>
            Yes, sign out
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
