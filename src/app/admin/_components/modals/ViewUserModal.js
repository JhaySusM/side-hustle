"use client";

import { useEffect, useState } from "react";
import Overlay from "./Overlay";

const METHOD_LABEL = { password: "Email & Password", google: "Google", facebook: "Facebook" };

function formatDateTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ViewUserModal({ user, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/users/${user.id}`, { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load user details");
        return payload;
      })
      .then((payload) => {
        if (!cancelled) setDetail(payload);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load user details");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) return null;

  const stats = detail?.stats;
  const loginActivity = detail?.loginActivity || [];

  return (
    <Overlay show={Boolean(user)} onClose={onClose} maxWidth={640}>
      <h3>👤 {user.name}</h3>

      <div className="listing-preview-meta" style={{ marginBottom: 18 }}>
        <div className="listing-preview-box">
          <div className="k">Email</div>
          <div className="v">{user.email}</div>
        </div>
        <div className="listing-preview-box">
          <div className="k">Phone</div>
          <div className="v">{user.phone}</div>
        </div>
        <div className="listing-preview-box">
          <div className="k">City</div>
          <div className="v">{user.city}</div>
        </div>
        <div className="listing-preview-box">
          <div className="k">Joined</div>
          <div className="v">{user.joined}</div>
        </div>
        <div className="listing-preview-box">
          <div className="k">Listings</div>
          <div className="v">{loading ? "…" : stats?.listings ?? user.listings}</div>
        </div>
        <div className="listing-preview-box">
          <div className="k">Transactions</div>
          <div className="v">{loading ? "…" : stats?.transactions ?? "—"}</div>
        </div>
        <div className="listing-preview-box">
          <div className="k">Reports Received</div>
          <div className="v">{loading ? "…" : stats?.reportsReceived ?? "—"}</div>
        </div>
        <div className="listing-preview-box">
          <div className="k">Status</div>
          <div className="v">{user.status}</div>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔐 Login Activity</div>
      {error ? (
        <div style={{ fontSize: 12, color: "var(--danger)" }}>{error}</div>
      ) : loading ? (
        <div style={{ fontSize: 12, color: "var(--mut)" }}>Loading…</div>
      ) : loginActivity.length ? (
        <div className="tbl-wrap" style={{ maxHeight: 220, overflowY: "auto" }}>
          <table>
            <tbody>
              <tr>
                <th>When</th>
                <th>Method</th>
                <th>IP Address</th>
                <th>Device</th>
              </tr>
              {loginActivity.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.createdAt)}</td>
                  <td>{METHOD_LABEL[entry.metadata?.method] || entry.metadata?.method || "—"}</td>
                  <td>{entry.ipAddress || "—"}</td>
                  <td
                    style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={entry.userAgent || ""}
                  >
                    {entry.userAgent || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--mut)" }}>No login activity recorded yet.</div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Close
        </button>
      </div>
    </Overlay>
  );
}
