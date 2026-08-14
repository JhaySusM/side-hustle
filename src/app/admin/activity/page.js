"use client";

import { useEffect, useMemo, useState } from "react";
import StatCard from "../_components/StatCard";
import { useToast } from "../_components/Toast";

const CATEGORY_OPTIONS = [
  { value: "account", label: "Account" },
  { value: "listing", label: "Listing" },
  { value: "transaction", label: "Transaction" },
];

const STATUS_OPTIONS = [
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
  { value: "flagged", label: "Flagged" },
  { value: "admin", label: "Admin" },
];

const STATUS_TAG = { success: "tag-ok", failed: "tag-danger", pending: "tag-warn", flagged: "tag-warn", admin: "tag-info" };

const RANGE_OPTIONS = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "", label: "All time" },
];

function prettify(value) {
  return (
    String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase()) || "—"
  );
}

function formatDateTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function filterActivityRows(activities, { search, category, status, rangeDays }) {
  const q = search.trim().toLowerCase();
  const days = Number(rangeDays) || null;
  const cutoff = days ? Date.now() - days * 24 * 60 * 60 * 1000 : null;
  return activities.filter((row) => {
    const matchQ =
      !q ||
      (row.user || "").toLowerCase().includes(q) ||
      (row.actor || "").toLowerCase().includes(q) ||
      (row.detail || "").toLowerCase().includes(q);
    const matchCategory = !category || row.category === category;
    const matchStatus = !status || row.status === status;
    const matchRange = !cutoff || new Date(row.time).getTime() >= cutoff;
    return matchQ && matchCategory && matchStatus && matchRange;
  });
}

function exportActivityCSV(rows) {
  const csvRows = [
    ["Time", "User", "Action", "Detail", "Status", "IP Address", "Device"],
    ...rows.map((r) => [formatDateTime(r.time), r.user || "", prettify(r.action), r.detail || "", r.status, r.ipAddress || "", r.userAgent || ""]),
  ];
  const csv = csvRows.map((row) => row.map(csvCell).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = "tradigo_activity_log.csv";
  a.click();
}

export default function AdminActivityPage() {
  const showToast = useToast();
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [rangeDays, setRangeDays] = useState("7");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/activity", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load activity log");
        return payload;
      })
      .then((payload) => {
        if (cancelled) return;
        setActivities(payload.activities || []);
        setSummary(payload.summary || {});
      })
      .catch((error) => {
        if (!cancelled) showToast(`❌ ${error.message || "Failed to load activity log."}`, "danger");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(
    () => filterActivityRows(activities, { search, category, status, rangeDays }),
    [activities, search, category, status, rangeDays]
  );

  const visibleRows = filteredRows.slice(0, 200);

  if (loading) {
    return <div style={{ padding: 40, color: "var(--mut)" }}>Loading activity log...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>User activity log</div>
        <div style={{ fontSize: 13, color: "var(--mut)" }}>Every account, listing, and transaction event across the platform</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 300,
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "9px 12px",
            fontSize: 13,
            outline: "none",
          }}
          placeholder="🔍  Search user, email, detail…"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={rangeDays}
          onChange={(e) => setRangeDays(e.target.value)}
          style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
        >
          {RANGE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-teal" style={{ marginLeft: "auto" }} onClick={() => exportActivityCSV(filteredRows)}>
          Export CSV
        </button>
      </div>

      <div className="stat-grid">
        <StatCard label="Events Today" value={summary.eventsToday ?? 0} icon="📊" />
        <StatCard label="Failed Logins" value={summary.failedLogins ?? 0} icon="⚠️" valueStyle={{ color: "var(--danger)" }} />
        <StatCard label="Flagged Listings" value={summary.flaggedListingsToday ?? 0} icon="🚩" valueStyle={{ color: "var(--warn)" }} />
        <StatCard label="New Accounts" value={summary.newAccountsToday ?? 0} icon="🆕" />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          {!visibleRows.length ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--mut)" }}>No activity matches the current filters.</div>
          ) : (
            <table>
              <tbody>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Detail</th>
                  <th>Status</th>
                  <th>IP / Device</th>
                </tr>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(row.time)}</td>
                    <td>{row.actorType === "admin" && row.actor ? `Admin · ${row.actor}` : row.user || "—"}</td>
                    <td>{prettify(row.action)}</td>
                    <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.detail || ""}>
                      {row.detail || "—"}
                    </td>
                    <td>
                      <span className={`tag ${STATUS_TAG[row.status] || "tag-muted"}`}>{prettify(row.status)}</span>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      {row.ipAddress || row.userAgent ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span>{row.ipAddress || "—"}</span>
                          {row.userAgent ? (
                            <span style={{ fontSize: 11, color: "var(--mut)", whiteSpace: "normal", wordBreak: "break-word" }}>
                              {row.userAgent}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        "internal"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "var(--mut)" }}>
        Showing {visibleRows.length.toLocaleString()} of {filteredRows.length.toLocaleString()} events
      </div>
    </div>
  );
}
