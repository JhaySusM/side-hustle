"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import "./admin.css";
import { AdminDataProvider, useAdminData } from "./_context/AdminDataContext";
import { ToastProvider } from "./_components/Toast";
import Sidebar from "./_components/Sidebar";
import Topbar from "./_components/Topbar";

function SessionWatcher({ onSessionExpired }) {
  const { sessionExpired } = useAdminData();

  useEffect(() => {
    if (sessionExpired) onSessionExpired();
  }, [sessionExpired, onSessionExpired]);

  return null;
}

function AdminShell({ children, onSignOut, onSessionExpired }) {
  return (
    <AdminDataProvider>
      <ToastProvider>
        <SessionWatcher onSessionExpired={onSessionExpired} />
        <div className="admin-shell">
          <Sidebar />
          <div className="main">
            <Topbar onSignOut={onSignOut} />
            <div className="content">{children}</div>
          </div>
        </div>
      </ToastProvider>
    </AdminDataProvider>
  );
}

export default function AdminLayout({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const res = await fetch("/api/admin/login", { credentials: "include", cache: "no-store" });
        if (!cancelled) setAuthed(res.ok);
      } catch {
        if (!cancelled) setAuthed(false);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setLoginError("Invalid admin credentials.");
        return;
      }

      setAuthed(true);
    } catch {
      setLoginError("Invalid admin credentials.");
    }
  }

  async function handleSignOut() {
    try {
      await fetch("/api/admin/login", { method: "DELETE", credentials: "include" });
    } finally {
      setAuthed(false);
    }
  }

  if (!authChecked) {
    return <div className="admin-loading-page">Loading admin panel...</div>;
  }

  if (!authed) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-logo-wrap">
            <Image
              src="/img/header/Logo TradiGO.png"
              alt="TradiGO"
              width={170}
              height={52}
              priority
              style={{ width: "auto", height: "auto" }}
            />
          </div>
          <h1 className="admin-login-title">Admin Panel</h1>
          <p className="admin-login-subtitle">Sign in to open the backoffice dashboard.</p>

          {loginError ? <div className="admin-login-error">{loginError}</div> : null}

          <form onSubmit={handleLogin} className="admin-login-form">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@gmail.com"
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
            />

            <button type="submit" className="admin-login-submit">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AdminShell onSignOut={handleSignOut} onSessionExpired={() => setAuthed(false)}>
      {children}
    </AdminShell>
  );
}
