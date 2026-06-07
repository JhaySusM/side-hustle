"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Navbar as RSNavbar,
  NavbarBrand,
  NavbarToggler,
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

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const mobileMenuRef = useRef(null);

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
      }
    }
    fetchUser();
  }, []);

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

  // Close mobile menu on outside click
  useEffect(() => {
    function handleOutsideClick(e) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  function handlePostClick() {
    if (!user) {
      setAuthOpen(true);
    } else {
      router.push("/post");
    }
    setIsOpen(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    setIsOpen(false);
    setDropdownOpen(false);
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

  return (
    <>
      <RSNavbar light expand="lg" className="bg-white shadow-sm py-0" style={{ position: "relative" }}>
        <Container className="d-flex align-items-center">

          {/* Brand */}
          <NavbarBrand href="/" className="me-3 d-flex align-items-center gap-3">
            <Image src="/img/batjee logo 2.png" alt="Batjee Logo" width={160} height={64} style={{ objectFit: "contain" }} />
            <span className="d-none d-lg-inline" style={{ fontSize: "0.85rem", color: "#555", border: "1px solid #ccc", borderRadius: "999px", padding: "3px 12px", whiteSpace: "nowrap" }}>
              Post • Talk • Deal
            </span>
          </NavbarBrand>

          {/* Desktop nav */}
          <Collapse navbar className="d-none d-lg-flex">
            <Nav className="mx-auto" navbar>
              <NavItem><NavLink href="/#home">Home</NavLink></NavItem>
              <NavItem><NavLink href="/#marketplace">Marketplace</NavLink></NavItem>
              <NavItem><NavLink href="/#about">About</NavLink></NavItem>
              <NavItem><NavLink href="/#contact">Contact</NavLink></NavItem>
            </Nav>

            {user ? (
              <div className="d-flex align-items-center gap-2">
                {/* Bell icon */}
                <div
                  onClick={() => router.push("/messages")}
                  style={{ position: "relative", cursor: "pointer", padding: "4px 6px" }}
                  title="Messages"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#555" strokeWidth={1.8}>
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
                style={{ backgroundColor: "#0a9e8f", border: "none", borderRadius: "8px", fontWeight: 600, padding: "8px 20px", whiteSpace: "nowrap" }}
              >
                Login
              </Button>
            )}
          </Collapse>

          {/* Mobile toggler — pushed to right */}
          <NavbarToggler
            className="d-lg-none ms-auto border-0"
            onClick={() => setIsOpen(!isOpen)}
          />
        </Container>

        {/* Mobile dropdown panel */}
        {isOpen && (
          <div
            ref={mobileMenuRef}
            className="d-lg-none"
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              width: 240,
              background: "#fff",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              borderRadius: "0 0 0 12px",
              zIndex: 1050,
              padding: "8px 0",
            }}
          >
            <Nav vertical>
              <NavItem>
                <NavLink href="/#home" className="px-4 py-2" onClick={() => setIsOpen(false)}>Home</NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="/#marketplace" className="px-4 py-2" onClick={() => setIsOpen(false)}>Marketplace</NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="/#about" className="px-4 py-2" onClick={() => setIsOpen(false)}>About</NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="/#contact" className="px-4 py-2" onClick={() => setIsOpen(false)}>Contact</NavLink>
              </NavItem>
            </Nav>
            <hr className="my-2" />
            {user ? (
              <div className="px-4 pb-2">
                <div className="d-flex align-items-center gap-2 mb-2">
                  {userAvatar}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{user.email}</div>
                  </div>
                </div>
                <Button size="sm" color="light" className="w-100 mb-1 border" onClick={() => { router.push("/dashboard"); setIsOpen(false); }}>
                  My Dashboard
                </Button>
                <Button size="sm" color="light" className="w-100 mb-1 border d-flex align-items-center justify-content-center gap-2" onClick={() => { router.push("/messages"); setIsOpen(false); }}>
                  My Messages
                  {unreadCount > 0 && (
                    <span className="badge bg-danger rounded-pill" style={{ fontSize: 11 }}>{unreadCount}</span>
                  )}
                </Button>
                <Button size="sm" color="danger" outline className="w-100" onClick={openLogoutModal}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="px-4 pb-2">
                <Button
                  className="w-100"
                  onClick={handlePostClick}
                  style={{ backgroundColor: "#0a9e8f", border: "none", borderRadius: "8px", fontWeight: 600 }}
                >
                  Login
                </Button>
              </div>
            )}
          </div>
        )}
      </RSNavbar>

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
