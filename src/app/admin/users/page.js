"use client";

import { useMemo, useState } from "react";
import { useAdminData } from "../_context/AdminDataContext";
import { useToast } from "../_components/Toast";
import { hydrateUsersList } from "../_lib/deriveStats";

const USERS_PER_PAGE = 7;

const STATUS_TAG = { Active: "tag-ok", Reported: "tag-warn", Pending: "tag-warn", Suspended: "tag-danger" };

const CITY_OPTIONS = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad"];
const STATUS_OPTIONS = ["Active", "Suspended", "Reported"];

function exportUsersCSV(filteredRows) {
  const rows = [
    ["Name", "Email", "Phone", "City", "Joined", "Listings", "Status"],
    ...filteredRows.map((u) => [u.name, u.email, u.phone, u.city, u.joined, u.listings, u.status]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = "tradigo_users.csv";
  a.click();
}

export default function AdminUsersPage() {
  const { users, products, reports, patchUsers, loading } = useAdminData();
  const showToast = useToast();

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => hydrateUsersList(users, products, reports), [users, products, reports]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((u) => {
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
      const matchCity = !city || u.city === city;
      const matchStatus = !status || u.status === status;
      return matchQ && matchCity && matchStatus;
    });
  }, [rows, search, city, status]);

  // Derives the clamped page straight from the filtered set on every render —
  // equivalent to the old file's in-place clamp of `userPage` in renderUsers(),
  // without the setState-in-effect anti-pattern.
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / USERS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * USERS_PER_PAGE;
  const pageRows = filteredRows.slice(start, start + USERS_PER_PAGE);

  function changePage(dir) {
    setPage((p) => Math.min(totalPages, Math.max(1, p + dir)));
  }

  async function handleUserAction(user, action) {
    if (action === "view") {
      showToast(
        `👤 ${user.name} · 📧 ${user.email} · 📞 ${user.phone} · 📍 ${user.city} · 📋 ${user.listings} listings · 📅 Joined ${user.joined}`,
        "ok"
      );
      return;
    }

    const nextStatus = action === "suspend" || action === "reject" ? "inactive" : "active";

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to update user status");

      patchUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
      showToast(`✅ User ${user.name} updated.`, "ok");
    } catch (error) {
      showToast(`❌ ${error.message || "Failed to update user."}`, "danger");
    }
  }

  if (loading) {
    return <div style={{ padding: 40, color: "var(--mut)" }}>Loading users...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            maxWidth: 300,
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "9px 12px",
            fontSize: 13,
            outline: "none",
          }}
          placeholder="🔍  Search by name, email, phone…"
        />
        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPage(1);
          }}
          style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
        >
          <option value="">All Cities</option>
          {CITY_OPTIONS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button type="button" className="btn btn-teal" onClick={() => exportUsersCSV(filteredRows)}>
          Export CSV
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          {!pageRows.length ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--mut)" }}>No users match the current filters.</div>
          ) : (
            <table>
              <tbody>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Joined</th>
                  <th>Listings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
                {pageRows.map((u) => {
                  const sc = STATUS_TAG[u.status] || "tag-muted";
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex">
                          <div className="avatar" style={{ background: u.color }}>
                            {u.name[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: "var(--mut)" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.phone}</td>
                      <td>{u.city}</td>
                      <td>{u.joined}</td>
                      <td>{u.listings}</td>
                      <td>
                        <span className={`tag ${sc}`}>{u.status}</span>
                      </td>
                      <td>
                        {u.status === "Suspended" ? (
                          <button type="button" className="btn btn-sm btn-ok" onClick={() => handleUserAction(u, "reinstate")}>
                            Reinstate
                          </button>
                        ) : u.status === "Pending" ? (
                          <>
                            <button type="button" className="btn btn-sm btn-ok" onClick={() => handleUserAction(u, "verify")}>
                              Verify
                            </button>{" "}
                            <button type="button" className="btn btn-sm btn-danger" onClick={() => handleUserAction(u, "reject")}>
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="btn btn-sm btn-outline" onClick={() => handleUserAction(u, "view")}>
                              View
                            </button>{" "}
                            <button type="button" className="btn btn-sm btn-danger" onClick={() => handleUserAction(u, "suspend")}>
                              Suspend
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontSize: 13, color: "var(--mut)" }}>
        <span>
          Showing {filteredRows.length ? start + 1 : 0}–{Math.min(start + USERS_PER_PAGE, filteredRows.length)} of{" "}
          {filteredRows.length.toLocaleString()} users
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => changePage(-1)}
            disabled={currentPage <= 1}
            style={{ opacity: currentPage <= 1 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-teal btn-sm"
            onClick={() => changePage(1)}
            disabled={currentPage >= totalPages}
            style={{ opacity: currentPage >= totalPages ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
