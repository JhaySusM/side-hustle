"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const res = await fetch("/api/admin/login", { cache: "no-store" });
        if (!cancelled) {
          setAuthed(res.ok);
        }
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

  if (!authChecked) {
    return (
      <div style={styles.centeredPage}>
        <div style={styles.loadingText}>Loading admin panel...</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={styles.centeredPage}>
        <div style={styles.loginCard}>
          <div style={styles.logoWrap}>
            <Image
              src="/img/header/Logo TradiGo.png"
              alt="TradiGO"
              width={170}
              height={52}
              priority
              style={styles.logoImage}
            />
          </div>
          <h1 style={styles.title}>Admin Panel</h1>
          <p style={styles.subtitle}>Sign in to open the backoffice dashboard.</p>

          {loginError ? <div style={styles.error}>{loginError}</div> : null}

          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@gmail.com"
              style={styles.input}
            />

            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              style={styles.input}
            />

            <button type="submit" style={styles.primaryButton}>Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src="/admin-backoffice.html"
      title="TradiGO Backoffice"
      style={styles.iframe}
    />
  );
}

const styles = {
  centeredPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "linear-gradient(135deg, #0d1f67, #18357f)",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
  },
  loginCard: {
    width: "100%",
    maxWidth: 420,
    background: "#ffffff",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
    textAlign: "center",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoImage: {
    width: "auto",
    height: "auto",
  },
  title: {
    margin: "4px 0 0",
    fontSize: 24,
    color: "#111827",
  },
  subtitle: {
    margin: "8px 0 18px",
    fontSize: 13,
    color: "#6b7280",
  },
  error: {
    marginBottom: 12,
    padding: "10px 12px",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
  },
  form: {
    display: "grid",
    gap: 10,
    textAlign: "left",
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
  },
  input: {
    height: 40,
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "0 12px",
    fontSize: 14,
    backgroundColor: "#ffffff",
    color: "#111827",
    outline: "none",
  },
  primaryButton: {
    marginTop: 8,
    height: 42,
    border: "none",
    borderRadius: 10,
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  iframe: {
    border: "none",
    width: "100%",
    height: "100vh",
  },
};
