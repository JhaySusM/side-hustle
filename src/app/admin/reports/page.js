"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAdminData } from "../_context/AdminDataContext";
import ResolveReportModal from "../_components/modals/ResolveReportModal";
import { prettifyReportType, reportPriorityTag, reportStatusTag, toRelativeTime } from "../_lib/format";

const TABS = [
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
];

export default function AdminReportsPage() {
  const { reports, reportSummary, loading } = useAdminData();
  const [activeTab, setActiveTab] = useState("open");
  const [selectedReport, setSelectedReport] = useState(null);

  const counts = useMemo(
    () => ({
      open: reports.filter((report) => report.status === "open").length,
      resolved: reports.filter((report) => report.status === "resolved").length,
      all: reports.length,
    }),
    [reports]
  );

  const filteredReports = useMemo(
    () => (activeTab === "all" ? reports : reports.filter((report) => report.status === activeTab)),
    [reports, activeTab]
  );

  if (loading) {
    return <div style={{ padding: 40, color: "var(--mut)" }}>Loading reports...</div>;
  }

  return (
    <div className="reports-shell">
      <div className="card reports-hero">
        <div className="reports-hero-top">
          <div>
            <div className="reports-kicker">Trust & Safety Desk</div>
            <h2>Review complaints, resolve incidents, and track moderation pressure.</h2>
            <p>Keep the queue moving with a clearer incident overview and a single review surface for listings and seller reports.</p>
          </div>
          <div className="reports-hero-chip">Moderation queue live</div>
        </div>
        <div className="reports-hero-stats">
          <div className="stat reports-stat is-danger">
            <div className="label">Open Reports</div>
            <div className="val">{reportSummary.open || 0}</div>
            <div className="delta">Needs active review</div>
            <div className="ic-bg">🚨</div>
          </div>
          <div className="stat reports-stat is-success">
            <div className="label">Resolved Today</div>
            <div className="val">{reportSummary.resolvedToday || 0}</div>
            <div className="delta">Closed in current cycle</div>
            <div className="ic-bg">✅</div>
          </div>
          <div className="stat reports-stat">
            <div className="label">Avg Resolution</div>
            <div className="val">{Number(reportSummary.avgResolutionHours || 0).toFixed(1)}h</div>
            <div className="delta">Median handling speed</div>
            <div className="ic-bg">⏱️</div>
          </div>
          <div className="stat reports-stat is-danger">
            <div className="label">Banned Users</div>
            <div className="val">{reportSummary.bannedUsers || 0}</div>
            <div className="delta">This month</div>
            <div className="ic-bg">⛔</div>
          </div>
        </div>
      </div>

      <div className="card reports-panel">
        <div className="reports-panel-head">
          <div className="reports-panel-title">
            <h3>Incident Queue</h3>
            <p>Filter open and resolved complaints, then resolve each case from the action column.</p>
          </div>
        </div>
        <div className="reports-tab-rail">
          <div className="tabs">
            {TABS.map((tab) => (
              <div
                key={tab.key}
                className={`tab ${activeTab === tab.key ? "active" : ""}`.trim()}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label} ({counts[tab.key]})
              </div>
            ))}
          </div>
        </div>
        <div className="tbl-wrap reports-table-wrap">
          <table>
            <tbody>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Target</th>
                <th>Reported By</th>
                <th>Submitted</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
              {!filteredReports.length ? (
                <tr>
                  <td colSpan={8} className="reports-empty">
                    <strong>No reports in this view.</strong>
                    Switch tabs or wait for new incidents to appear in the moderation queue.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td className="report-id">#R-{report.id}</td>
                    <td>{prettifyReportType(report.reportType)}</td>
                    <td className="report-target">
                      {report.listing?.id ? (
                        <Link href={`/product/${report.listing.id}`} style={{ color: "var(--teal)" }}>
                          {report.listing.title}
                        </Link>
                      ) : (
                        `Seller: ${report.seller?.name || report.seller?.email || "Unknown seller"}`
                      )}
                    </td>
                    <td>{report.reporter?.name || "Unknown"}</td>
                    <td>{toRelativeTime(report.createdAt)}</td>
                    <td>
                      <span className={`tag ${reportPriorityTag(report.priority)}`}>{prettifyReportType(report.priority)}</span>
                    </td>
                    <td>
                      <span className={`tag ${reportStatusTag(report.status)}`}>{prettifyReportType(report.status)}</span>
                    </td>
                    <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {report.status !== "resolved" ? (
                        <button type="button" className="btn btn-sm btn-teal" onClick={() => setSelectedReport(report)}>
                          Resolve
                        </button>
                      ) : (
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => setSelectedReport(report)}>
                          View
                        </button>
                      )}
                      {report.imageUrl ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => window.open(report.imageUrl, "_blank")}
                        >
                          View image
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ResolveReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
    </div>
  );
}
