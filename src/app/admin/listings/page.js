"use client";

import { useMemo, useState } from "react";
import { useAdminData } from "../_context/AdminDataContext";
import { useToast } from "../_components/Toast";
import ListingPreviewModal from "../_components/modals/ListingPreviewModal";
import { mapProductsToListingRows, refreshListingApprovalStats } from "../_lib/deriveStats";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

// Maps the local listing-row status (used across this page) to the
// product_status value the /api/products/status endpoint expects.
const STATUS_TO_PRODUCT_STATUS = {
  approved: "Active",
  rejected: "Inactive",
  pending: "Pending",
};

async function updateListingStatusOnServer(listingId, nextStatus) {
  const res = await fetch("/api/products/status", {
    method: "PATCH",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: Number(listingId), product_status: nextStatus }),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || "Failed to update listing status");
}

export default function AdminListingsPage() {
  const { products, patchProducts, loading } = useAdminData();
  const showToast = useToast();

  const [activeTab, setActiveTab] = useState("pending");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [previewListing, setPreviewListing] = useState(null);

  const rows = useMemo(() => mapProductsToListingRows(products), [products]);
  const stats = useMemo(() => refreshListingApprovalStats(rows), [rows]);

  const counts = useMemo(
    () => ({
      pending: rows.filter((row) => row.status === "pending").length,
      approved: rows.filter((row) => row.status === "approved").length,
      rejected: rows.filter((row) => row.status === "rejected").length,
    }),
    [rows]
  );

  const visibleRows = useMemo(() => rows.filter((row) => row.status === activeTab), [rows, activeTab]);

  // Selection is scoped to whichever tab is currently rendered, matching the
  // old file's behavior where switching tabs re-rendered the table and lost
  // any checked checkboxes. Cleared on tab click below rather than in an
  // effect, since it's a response to a direct user action, not a sync.
  function switchTab(tab) {
    setActiveTab(tab);
    setSelectedIds(new Set());
  }

  function applyLocalStatus(listingIds, newStatus) {
    const idSet = new Set(listingIds);
    patchProducts((prev) =>
      prev.map((product) =>
        idSet.has(String(product.id))
          ? { ...product, product_status: STATUS_TO_PRODUCT_STATUS[newStatus] }
          : product
      )
    );
  }

  async function actListing(listing, action) {
    try {
      if (action === "approve") {
        await updateListingStatusOnServer(listing.id, "Active");
        applyLocalStatus([listing.id], "approved");
        showToast(`✅ Listing #${listing.id} approved.`, "ok");
      } else if (action === "reject" || action === "reject-ban") {
        await updateListingStatusOnServer(listing.id, "Inactive");
        applyLocalStatus([listing.id], "rejected");
        // TODO: no dedicated ban endpoint exists yet — "reject-ban" performs
        // the same status update as a plain reject, matching the old file.
        const extra = action === "reject-ban" ? " User banned." : "";
        showToast(`🚫 Listing #${listing.id} rejected.${extra}`, "danger");
      } else if (action === "restore") {
        await updateListingStatusOnServer(listing.id, "Pending");
        applyLocalStatus([listing.id], "pending");
        showToast(`↩ Listing #${listing.id} moved back to Pending.`, "warn");
      }
    } catch (error) {
      showToast(`❌ ${error.message || "Failed to update listing."}`, "danger");
    }
  }

  async function approveAllClean() {
    const toApprove = rows.filter((row) => row.status === "pending" && row.flag === "clean");
    if (!toApprove.length) {
      showToast("No clean listings to approve.", "warn");
      return;
    }

    try {
      await Promise.all(toApprove.map((listing) => updateListingStatusOnServer(listing.id, "Active")));
    } catch (error) {
      showToast(`❌ ${error.message || "Bulk approval failed."}`, "danger");
      return;
    }

    applyLocalStatus(toApprove.map((listing) => listing.id), "approved");
    showToast(`✅ ${toApprove.length} clean listing(s) approved.`, "ok");
  }

  async function rejectSelected() {
    const checked = [...selectedIds];
    if (!checked.length) {
      showToast("Select at least one listing first.", "warn");
      return;
    }

    const selectedListings = checked
      .map((id) => rows.find((row) => row.id === id))
      .filter((listing) => listing && listing.status === "pending");

    try {
      await Promise.all(selectedListings.map((listing) => updateListingStatusOnServer(listing.id, "Inactive")));
    } catch (error) {
      showToast(`❌ ${error.message || "Bulk rejection failed."}`, "danger");
      return;
    }

    applyLocalStatus(selectedListings.map((listing) => listing.id), "rejected");
    showToast(`🚫 ${checked.length} listing(s) rejected.`, "danger");
    setSelectedIds(new Set());
  }

  function toggleAllChk(checked) {
    setSelectedIds(checked ? new Set(visibleRows.map((row) => row.id)) : new Set());
  }

  function toggleRowChk(id, checked) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  if (loading) {
    return <div style={{ padding: 40, color: "var(--mut)" }}>Loading listings...</div>;
  }

  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id));

  return (
    <div className="listing-shell">
      <div className="card listing-hero">
        <div className="listing-hero-top">
          <div>
            <div className="listing-kicker">Moderation Review Desk</div>
            <h2>Approve clean listings faster and catch risky items before they go live.</h2>
            <p>Track the queue, bulk-handle safe submissions, and resolve suspicious products from a single moderation surface.</p>
          </div>
          <div className="listing-hero-chip">Review queue live</div>
        </div>
        <div className="listing-hero-stats">
          <div className="stat listing-stat is-warn">
            <div className="label">Pending Review</div>
            <div className="val">{stats.pending.toLocaleString()}</div>
            <div className="delta">Waiting for moderation</div>
            <div className="ic-bg">⏳</div>
          </div>
          <div className="stat listing-stat is-ok">
            <div className="label">Approved Today</div>
            <div className="val">{stats.approvedToday.toLocaleString()}</div>
            <div className="delta">Moved live this cycle</div>
            <div className="ic-bg">✅</div>
          </div>
          <div className="stat listing-stat is-danger">
            <div className="label">Rejected Today</div>
            <div className="val">{stats.rejectedToday.toLocaleString()}</div>
            <div className="delta">Blocked before publish</div>
            <div className="ic-bg">🚫</div>
          </div>
          <div className="stat listing-stat">
            <div className="label">Auto-Approved</div>
            <div className="val">{stats.autoApprovedPct.toFixed(1)}%</div>
            <div className="delta">Approved share of reviewed items</div>
            <div className="ic-bg">⚙️</div>
          </div>
        </div>
      </div>

      <div className="card listing-panel">
        <div className="listing-panel-head">
          <div className="listing-panel-title">
            <h3>Listing Queue</h3>
            <p>Review pending submissions, restore previous decisions, or take bulk action on selected rows.</p>
          </div>
        </div>
        <div className="listing-tab-rail">
          <div className="tabs">
            {TABS.map((tab) => (
              <div
                key={tab.key}
                className={`tab ${activeTab === tab.key ? "active" : ""}`.trim()}
                onClick={() => switchTab(tab.key)}
              >
                {tab.label} ({counts[tab.key]})
              </div>
            ))}
          </div>
        </div>
        <div className="listing-bulk-bar">
          <span className="bulk-copy">{selectedIds.size ? `${selectedIds.size} selected` : "0 selected"}</span>
          <div className="listing-bulk-actions">
            <button type="button" className="btn btn-ok btn-sm" onClick={approveAllClean}>
              ✓ Approve All Clean
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={rejectSelected}>
              ✕ Reject Selected
            </button>
          </div>
        </div>
        <div className="tbl-wrap listing-table-wrap">
          {!visibleRows.length ? (
            <div className="listing-empty">
              <strong>No {activeTab} listings.</strong>
              The {activeTab} queue is currently clear.
            </div>
          ) : (
            <table>
              <tbody>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(e) => toggleAllChk(e.target.checked)}
                    />
                  </th>
                  <th>Listing</th>
                  <th>Seller</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>City</th>
                  <th>Flag</th>
                  <th>Actions</th>
                </tr>
                {visibleRows.map((listing) => {
                  const flagClass = listing.flag === "illegal" ? "tag-danger" : "tag-muted";
                  const titleStyle = listing.flag === "illegal" ? { color: "var(--danger)" } : undefined;

                  return (
                    <tr key={listing.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(listing.id)}
                          onChange={(e) => toggleRowChk(listing.id, e.target.checked)}
                        />
                      </td>
                      <td>
                        <div className="listing-item-main">
                          <span className="listing-item-emoji">{listing.emoji}</span>
                          <div>
                            <div className="listing-item-title" style={titleStyle}>
                              {listing.title}
                            </div>
                            <div className="listing-item-meta">
                              #{listing.id} · Posted {listing.time}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{listing.seller}</td>
                      <td>{listing.cat}</td>
                      <td>{listing.price}</td>
                      <td>{listing.city}</td>
                      <td>
                        <span className={`tag ${flagClass}`}>{listing.flagLabel}</span>
                      </td>
                      <td>
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => setPreviewListing(listing)}>
                          View
                        </button>{" "}
                        {activeTab === "pending" ? (
                          <>
                            {listing.flag !== "illegal" ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-ok"
                                onClick={() => actListing(listing, "approve")}
                              >
                                Approve
                              </button>
                            ) : null}{" "}
                            {listing.flag === "illegal" ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => actListing(listing, "reject-ban")}
                              >
                                Reject + Ban
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => actListing(listing, "reject")}
                              >
                                Reject
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => actListing(listing, "restore")}
                          >
                            ↩ Restore
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

      <ListingPreviewModal listing={previewListing} onClose={() => setPreviewListing(null)} />
    </div>
  );
}
