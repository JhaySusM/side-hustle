"use client";

import { useState } from "react";
import Overlay from "./Overlay";
import { useAdminData } from "../../_context/AdminDataContext";
import { useToast } from "../Toast";
import { mapFeaturePlacementLabelToValue } from "../../_lib/deriveStats";

export default function FeatureSellerModal({ seller, onClose }) {
  const { patchSellers } = useAdminData();
  const showToast = useToast();
  const [duration, setDuration] = useState("7 days");
  const [placement, setPlacement] = useState("Homepage Banner");
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (!seller?.id || submitting) return;

    const durationDays = parseInt(duration, 10);
    const placementValue = mapFeaturePlacementLabelToValue(placement);
    if (!durationDays || !placementValue) {
      showToast("❌ Invalid feature settings.", "danger");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/seller-features", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: seller.id, durationDays, placement: placementValue }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to feature seller");

      patchSellers(() => payload.sellers || []);
      showToast("✅ Seller featured successfully.", "ok");
      onClose();
    } catch (error) {
      showToast(`❌ ${error.message || "Failed to feature seller."}`, "danger");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Overlay show={Boolean(seller)} onClose={onClose}>
      <h3>⭐ Feature this Seller</h3>
      <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 10 }}>
        {seller ? `${seller.name} • ${seller.city || "Unknown city"} • ${seller.listings || 0} listing(s)` : ""}
      </div>
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label>Feature Duration</label>
        <select value={duration} onChange={(e) => setDuration(e.target.value)}>
          <option>7 days</option>
          <option>14 days</option>
          <option>30 days</option>
        </select>
      </div>
      <div className="form-group">
        <label>Placement</label>
        <select value={placement} onChange={(e) => setPlacement(e.target.value)}>
          <option>Homepage Banner</option>
          <option>Category Top</option>
          <option>Search Boost</option>
        </select>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-teal" onClick={handleConfirm} disabled={submitting}>
          {submitting ? "Saving..." : "Confirm"}
        </button>
      </div>
    </Overlay>
  );
}
