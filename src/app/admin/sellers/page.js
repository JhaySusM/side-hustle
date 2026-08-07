"use client";

import { useMemo, useState } from "react";
import { useAdminData } from "../_context/AdminDataContext";
import { useToast } from "../_components/Toast";
import StatCard from "../_components/StatCard";
import FeatureSellerModal from "../_components/modals/FeatureSellerModal";
import { hydrateSellersList, getActiveSellerFeatures, getSellerStatus, summarizeSellerPlacements } from "../_lib/deriveStats";

const SELLERS_PER_PAGE = 7;

const STATUS_TAG = { Active: "tag-ok", Verified: "tag-ok", Featured: "tag-info", Flagged: "tag-danger", Suspended: "tag-danger" };
const TYPE_TAG = { Individual: "tag-info", Business: "tag-warn" };

const TABS = [
  { key: "all", label: "All" },
  { key: "featured", label: "Featured" },
  { key: "business", label: "Business" },
  { key: "flagged", label: "Flagged" },
];

export default function AdminSellersPage() {
  const { sellers, products, patchSellers, loading } = useAdminData();
  const showToast = useToast();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedSeller, setSelectedSeller] = useState(null);
  // Client-only "Suspended" override — see handleSuspend() below for why this
  // never reaches the server.
  const [suspendedIds, setSuspendedIds] = useState(new Set());

  const rows = useMemo(() => hydrateSellersList(sellers, products), [sellers, products]);

  const statusOf = (seller) => (suspendedIds.has(seller.id) ? "Suspended" : getSellerStatus(seller));

  // Stats are always computed from the full (unfiltered) seller list, matching
  // the old renderSellers().
  const stats = useMemo(() => {
    const total = rows.length;
    const verified = rows.filter((s) => statusOf(s) === "Verified" || statusOf(s) === "Featured").length;
    const business = rows.filter((s) => s.type === "Business").length;
    const avgListings = total ? (rows.reduce((a, s) => a + (s.listings || 0), 0) / total).toFixed(1) : "0.0";
    const verifiedPct = total ? ((verified / total) * 100).toFixed(1) : "0.0";
    const bizPct = total ? ((business / total) * 100).toFixed(1) : "0.0";
    return { total, verified, business, avgListings, verifiedPct, bizPct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, suspendedIds]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((s) => {
      const matchQ = !q || s.name.toLowerCase().includes(q) || (s.city || "").toLowerCase().includes(q);
      const status = statusOf(s);
      const matchTab =
        tab === "all"
          ? true
          : tab === "featured"
          ? status === "Featured"
          : tab === "business"
          ? s.type === "Business"
          : tab === "flagged"
          ? status === "Flagged"
          : true;
      return matchQ && matchTab;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, tab, suspendedIds]);

  // Derives the clamped page straight from the filtered set on every render —
  // equivalent to the old file's in-place clamp of `sellerPage` in renderSellers(),
  // without the setState-in-effect anti-pattern.
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / SELLERS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * SELLERS_PER_PAGE;
  const pageRows = filteredRows.slice(start, start + SELLERS_PER_PAGE);

  function changePage(dir) {
    setPage((p) => Math.min(totalPages, Math.max(1, p + dir)));
  }

  function handleSuspend(seller) {
    // TODO: Suspend has no backend endpoint — this change is client-only and lost on refresh. Carried over from admin-backoffice.html as-is; out of scope for this HTML->React port.
    setSuspendedIds((prev) => new Set(prev).add(seller.id));
  }

  async function handleUnfeature(seller) {
    const activeFeatures = getActiveSellerFeatures(seller);
    if (!activeFeatures.length) return;

    try {
      let latestSellers = null;
      for (const feature of activeFeatures) {
        const res = await fetch(
          `/api/admin/seller-features?sellerId=${encodeURIComponent(seller.id)}&placement=${encodeURIComponent(feature.placement)}`,
          { method: "DELETE", credentials: "include", cache: "no-store" }
        );
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to remove seller feature");
        latestSellers = payload.sellers;
      }
      patchSellers(() => latestSellers || []);
      showToast("✅ Seller feature removed.", "ok");
    } catch (error) {
      showToast(`❌ ${error.message || "Failed to remove seller feature."}`, "danger");
    }
  }

  if (loading) {
    return <div style={{ padding: 40, color: "var(--mut)" }}>Loading sellers...</div>;
  }

  return (
    <div>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard label="Total Sellers" value={stats.total.toLocaleString()} delta={`▲ ${stats.total} total in dataset`} deltaClass="up" />
        <StatCard label="Verified Sellers" value={stats.verified.toLocaleString()} delta={`${stats.verifiedPct}% of all sellers`} deltaClass="up" />
        <StatCard label="Business Sellers" value={stats.business.toLocaleString()} delta={`${stats.bizPct}% of all sellers`} deltaClass="up" />
        <StatCard label="Avg Listings/Seller" value={stats.avgListings} delta={`Across ${stats.total} sellers`} deltaClass="up" />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            maxWidth: 280,
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "9px 12px",
            fontSize: 13,
            outline: "none",
          }}
          placeholder="🔍  Search seller name or city…"
        />
        <div className="tabs" style={{ border: "none", margin: 0, flex: 1 }}>
          {TABS.map((t) => (
            <div
              key={t.key}
              className={`tab ${tab === t.key ? "active" : ""}`.trim()}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
            >
              {t.label}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          {!pageRows.length ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--mut)" }}>No sellers match.</div>
          ) : (
            <table>
              <tbody>
                <tr>
                  <th>Seller</th>
                  <th>Type</th>
                  <th>City</th>
                  <th>Listings</th>
                  <th>Revenue</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
                {pageRows.map((s) => {
                  const status = statusOf(s);
                  const sc = STATUS_TAG[status] || "tag-muted";
                  const tc = TYPE_TAG[s.type] || "tag-muted";
                  const placementSummary = summarizeSellerPlacements(s);
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="flex">
                          <div className="avatar" style={{ background: s.color }}>
                            {s.name[0]}
                          </div>
                          <div>
                            <b>{s.name}</b>
                            <div style={{ fontSize: 11, color: "var(--mut)" }}>
                              Member since {s.since}
                              {placementSummary ? ` · ${placementSummary}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`tag ${tc}`}>{s.type}</span>
                      </td>
                      <td>{s.city}</td>
                      <td>{s.listings}</td>
                      <td>{s.revenue}</td>
                      <td>
                        {Number(s.rating || 0) > 0 ? (
                          `⭐ ${Number(s.rating).toFixed(1)}`
                        ) : (
                          <span style={{ color: "var(--mut)" }}>No ratings</span>
                        )}
                      </td>
                      <td>
                        <span className={`tag ${sc}`}>{status}</span>
                      </td>
                      <td>
                        {status === "Flagged" || status === "Suspended" ? (
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleSuspend(s)}>
                            Suspend
                          </button>
                        ) : status === "Featured" ? (
                          <button type="button" className="btn btn-sm btn-outline" onClick={() => handleUnfeature(s)}>
                            ★ Unfeature
                          </button>
                        ) : (
                          <button type="button" className="btn btn-sm btn-teal" onClick={() => setSelectedSeller(s)}>
                            ⭐ Feature
                          </button>
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
          Showing {filteredRows.length ? start + 1 : 0}–{Math.min(start + SELLERS_PER_PAGE, filteredRows.length)} of {filteredRows.length} sellers
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

      <FeatureSellerModal seller={selectedSeller} onClose={() => setSelectedSeller(null)} />
    </div>
  );
}
