"use client";

import { useEffect, useState } from "react";
import Overlay from "./Overlay";
import { useAdminData } from "../../_context/AdminDataContext";
import { useToast } from "../Toast";
import { prettifyReportType } from "../../_lib/format";

export default function ResolveReportModal({ report, onClose }) {
  const { patchReports } = useAdminData();
  const showToast = useToast();
  const [actionTaken, setActionTaken] = useState("none");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (report) {
      setActionTaken(report.actionTaken || "none");
      setAdminNote(report.adminNote || "");
    }
  }, [report]);

  async function handleSave() {
    if (!report?.id || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id, status: "resolved", actionTaken, adminNote }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to resolve report");

      patchReports((reports) => reports.map((r) => (r.id === payload.report.id ? payload.report : r)));
      showToast("✅ Report resolved.", "ok");
      onClose();
    } catch (error) {
      showToast(`❌ ${error.message || "Failed to resolve report."}`, "danger");
    } finally {
      setSubmitting(false);
    }
  }

  const meta = report
    ? `#R-${report.id} • ${prettifyReportType(report.reportType)} • ${report.listing?.title || report.seller?.name || report.seller?.email || "Unknown target"}`
    : "";

  return (
    <Overlay show={Boolean(report)} onClose={onClose}>
      <h3>🔍 Resolve Report</h3>
      <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 10 }}>{meta}</div>
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label>Action Taken</label>
        <select value={actionTaken} onChange={(e) => setActionTaken(e.target.value)}>
          <option value="none">No action (false report)</option>
          <option value="warning">Warning issued to user</option>
          <option value="listing_removed">Listing removed</option>
          <option value="user_suspended">User suspended</option>
          <option value="user_banned">User permanently banned</option>
        </select>
      </div>
      <div className="form-group">
        <label>Internal Note</label>
        <textarea
          rows={3}
          placeholder="Add notes for audit trail…"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
        />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-teal" onClick={handleSave} disabled={submitting}>
          {submitting ? "Saving..." : "Save & Resolve"}
        </button>
      </div>
    </Overlay>
  );
}
