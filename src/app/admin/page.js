"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAdminData } from "./_context/AdminDataContext";
import StatCard from "./_components/StatCard";
import LineChart from "./_components/charts/LineChart";
import DonutChart from "./_components/charts/DonutChart";
import { deriveUserActivity, hydrateDashboardStats } from "./_lib/deriveStats";
import { buildDauSeries, buildCategorySplit, buildRecentRegistrations, buildTopSellersThisWeek } from "./_lib/deriveCharts";
import { prettifyReportType, reportPriorityTag, toJoinedDate, toPkCurrency, toRelativeTime } from "./_lib/format";

const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

function AvatarCell({ name, color = "#0a6e6e" }) {
  return (
    <div className="flex">
      <div className="avatar" style={{ background: color }}>
        {(name || "?").charAt(0).toUpperCase()}
      </div>
      {name}
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { users, products, transactions, transactionSummary, reports, loading } = useAdminData();

  const activity = useMemo(() => deriveUserActivity(users, products, transactions), [users, products, transactions]);
  const dashboardStats = useMemo(
    () => hydrateDashboardStats(users, products, transactions, transactionSummary),
    [users, products, transactions, transactionSummary]
  );
  const dauSeries = useMemo(() => buildDauSeries(products, transactions), [products, transactions]);
  const categorySplit = useMemo(() => buildCategorySplit(products), [products]);
  const recentRegistrations = useMemo(() => buildRecentRegistrations(users), [users]);
  const topSellers = useMemo(() => buildTopSellersThisWeek(products), [products]);

  const openComplaints = useMemo(() => {
    return (reports || [])
      .filter((report) => report.status === "open")
      .sort((a, b) => {
        const ap = PRIORITY_RANK[String(a.priority || "").toLowerCase()] || 0;
        const bp = PRIORITY_RANK[String(b.priority || "").toLowerCase()] || 0;
        if (bp !== ap) return bp - ap;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      })
      .slice(0, 3);
  }, [reports]);

  const latestDau = dauSeries[dauSeries.length - 1] || { label: "Today", value: 0 };
  const peakDau = dauSeries.reduce((best, point) => (point.value > best.value ? point : best), dauSeries[0] || { label: "Today", value: 0 });

  if (loading) {
    return <div style={{ padding: 40, color: "var(--mut)" }}>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-shell">
      <div className="dashboard-overview">
        <div className="dashboard-hero-panel card">
          <div className="dashboard-hero-top">
            <div className="dashboard-kicker">Control Center</div>
            <div className="dashboard-hero-head">
              <div>
                <h2>Live marketplace overview for today.</h2>
                <p>Track operational volume, moderation pressure, and user activity from one surface without leaving the dashboard.</p>
              </div>
              <div className="dashboard-pulse">Live sync enabled</div>
            </div>
          </div>
          <div className="dashboard-hero-metrics">
            <StatCard
              className="dashboard-stat-feature"
              label="Transactions Today"
              value={activity.transactionsToday.toLocaleString()}
              icon="💸"
            />
            <StatCard
              className="dashboard-stat-feature"
              label="Pending Approval"
              value={dashboardStats.pendingCount.toLocaleString()}
              valueStyle={{ color: "var(--warn)" }}
              delta="⚠ Needs review"
              deltaStyle={{ color: "var(--warn)" }}
              icon="⏳"
            />
          </div>
        </div>

        <div className="dashboard-side-grid">
          <StatCard label="New Listings Today" value={activity.newListingsToday.toLocaleString()} icon="📢" />
          <StatCard label="New Registrations" value={activity.newRegistration.toLocaleString()} delta="Last 7 days" icon="🆕" />
          <StatCard label="Active Buyers" value={dashboardStats.activeBuyers.toLocaleString()} icon="🛒" />
          <StatCard label="Active Sellers" value={dashboardStats.activeSellers.toLocaleString()} icon="🏪" />
        </div>
      </div>

      <div className="dashboard-activity-grid">
        <StatCard label="DAU" value={activity.dau.toLocaleString()} delta="Live activity" icon="👤" />
        <StatCard label="WAU" value={activity.wau.toLocaleString()} delta="Live activity" icon="📅" />
        <StatCard label="MAU" value={activity.mau.toLocaleString()} delta="Live activity" icon="📆" />
      </div>

      <div className="dashboard-panel-grid">
        <div className="card dashboard-chart-card dashboard-mini-chart dashboard-dau-card">
          <div className="card-h">
            <h3>Daily Active Users — Last 14 Days</h3>
            <button type="button" className="btn btn-outline btn-sm">
              Export
            </button>
          </div>
          <div className="dashboard-mini-summary">
            <div>
              <div className="summary-label">Headline Total</div>
              <div className="summary-total">{latestDau.value.toLocaleString()}</div>
              <div className="summary-sub">Peak {peakDau.value.toLocaleString()} on {peakDau.label}</div>
            </div>
            <div className="summary-chip">{latestDau.label}</div>
          </div>
          <div className="dashboard-chart-stage">
            <div className="line-chart">
              <LineChart values={dauSeries.map((point) => point.value)} />
            </div>
            <div className="line-chart-labels">
              <span>14 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        <div className="card dashboard-chart-card dashboard-category-card">
          <div className="card-h">
            <h3>Listings by Category</h3>
          </div>
          <div className="dashboard-chart-stage dashboard-chart-stage-center">
            <div className="donut-wrap dashboard-category-wrap">
              <div className="dashboard-donut-column">
                <div className="dashboard-donut-stack">
                  <DonutChart slices={categorySplit.slices} />
                </div>
                <div className="dashboard-donut-lead">
                  {categorySplit.hasData ? `${categorySplit.totalListings.toLocaleString()} listings total` : "No category data"}
                </div>
              </div>
              <div className="legend dashboard-category-legend">
                {categorySplit.slices.map((slice) => (
                  <div className="leg-item" key={slice.label}>
                    <div className="leg-dot" style={{ background: slice.color }} />
                    <div className="leg-name">{slice.label}</div>
                    <div className="leg-share">{slice.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-table-grid">
        <div className="card dashboard-table-card">
          <div className="card-h">
            <h3>Recent Registrations</h3>
            <button type="button" className="btn btn-teal btn-sm" onClick={() => router.push("/admin/users")}>
              View All
            </button>
          </div>
          <div className="tbl-wrap">
            <table>
              <tbody>
                <tr>
                  <th>User</th>
                  <th>City</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
                {recentRegistrations.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <AvatarCell name={user.name} />
                    </td>
                    <td>{user.city}</td>
                    <td>{toJoinedDate(user.createdAt)}</td>
                    <td>
                      <span className={`tag ${user.status === "Active" ? "tag-ok" : "tag-danger"}`}>{user.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card dashboard-table-card">
          <div className="card-h">
            <h3>Top Sellers This Week</h3>
          </div>
          <div className="tbl-wrap">
            <table>
              <tbody>
                <tr>
                  <th>Seller</th>
                  <th>Listings</th>
                  <th>Revenue</th>
                  <th>Rating</th>
                </tr>
                {topSellers.map((seller) => (
                  <tr key={seller.id}>
                    <td>
                      <AvatarCell name={seller.name} />
                    </td>
                    <td>{seller.listings}</td>
                    <td>{toPkCurrency(seller.revenue)}</td>
                    <td>
                      {seller.ratingCount > 0 ? (
                        `⭐ ${seller.ratingAvg.toFixed(1)}`
                      ) : (
                        <span style={{ color: "var(--mut)" }}>No ratings</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card dashboard-alert-card">
        <div className="card-h">
          <h3>🚨 Open Complaints</h3>
          <button type="button" className="btn btn-danger btn-sm" onClick={() => router.push("/admin/reports")}>
            Review Now
          </button>
        </div>
        <div className="tbl-wrap">
          <table>
            <tbody>
              <tr>
                <th>Type</th>
                <th>Target</th>
                <th>Reported By</th>
                <th>Age</th>
                <th>Priority</th>
              </tr>
              {openComplaints.length ? (
                openComplaints.map((report) => (
                  <tr key={report.id}>
                    <td>{prettifyReportType(report.reportType)}</td>
                    <td>{report.listing?.id ? `Listing #${report.listing.id}` : `Seller #${report.seller?.id || "—"}`}</td>
                    <td>{report.reporter?.name || "Unknown"}</td>
                    <td>{toRelativeTime(report.createdAt)}</td>
                    <td>
                      <span className={`tag ${reportPriorityTag(report.priority)}`}>{prettifyReportType(report.priority)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--mut)", padding: 18 }}>
                    No open complaints.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
