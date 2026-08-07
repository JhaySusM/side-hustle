"use client";

import { useMemo } from "react";
import { useAdminData } from "../_context/AdminDataContext";
import StatCard from "../_components/StatCard";
import BarChart from "../_components/charts/BarChart";
import TrendLine from "../_components/charts/TrendLine";
import { computeAnalyticsHeadline, computeCityPerformance } from "../_lib/deriveAnalytics";
import { buildMauSeries, buildGmvByCategory } from "../_lib/deriveCharts";
import { formatCompact } from "../_lib/format";

export default function AdminAnalyticsPage() {
  const { users, products, transactions, conversations, loading } = useAdminData();

  const headline = useMemo(
    () => computeAnalyticsHeadline(users, products, transactions, conversations),
    [users, products, transactions, conversations]
  );
  const cityRows = useMemo(() => computeCityPerformance(users, products, transactions), [users, products, transactions]);
  const mauSeries = useMemo(() => buildMauSeries(products, transactions), [products, transactions]);
  const gmvByCategory = useMemo(() => buildGmvByCategory(products), [products]);

  if (loading) {
    return <div style={{ padding: 40, color: "var(--mut)" }}>Loading analytics...</div>;
  }

  const latestMau = mauSeries[mauSeries.length - 1]?.value || 0;

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Session Avg" value={headline.sessionAvg} delta={headline.sessionDelta} deltaClass="up" icon="⏱️" />
        <StatCard label="Bounce Rate" value={headline.bounceRate} delta={headline.bounceDelta} deltaClass="up" icon="↩️" />
        <StatCard label="Listings/User" value={headline.listingsPerUser} delta={headline.listingsDelta} deltaClass="up" icon="📢" />
        <StatCard label="Avg Listing Price" value={headline.avgPrice} delta={headline.avgPriceDelta} deltaClass="up" icon="💲" />
      </div>

      <div className="analytics-chart-grid">
        <div className="card analytics-chart-card">
          <div className="analytics-chart-head">
            <div className="analytics-chart-title">
              <h3>Monthly Active Users</h3>
              <p>Six-month view of live active-user volume.</p>
            </div>
            <div className="analytics-chart-metric">
              <div className="k">Current Month</div>
              <div className="v">{formatCompact(latestMau)}</div>
            </div>
          </div>
          <div className="analytics-chart-stage">
            <BarChart
              values={mauSeries.map((b) => b.value)}
              labels={mauSeries.map((b) => b.label)}
              valueFormatter={formatCompact}
              accentIndex={mauSeries.length - 1}
            />
            <TrendLine values={mauSeries.map((b) => b.value)} />
          </div>
        </div>

        <div className="card analytics-chart-card">
          <div className="analytics-chart-head">
            <div className="analytics-chart-title">
              <h3>GMV by Category</h3>
              <p>Top categories ranked by gross merchandise value.</p>
            </div>
            <div className="analytics-chart-metric">
              <div className="k">Top Category</div>
              <div className="v">{gmvByCategory.topCategory}</div>
            </div>
          </div>
          <div className="analytics-chart-stage">
            {gmvByCategory.bars.length ? (
              <BarChart
                values={gmvByCategory.bars.map((b) => b.value)}
                labels={gmvByCategory.bars.map((b) => b.label)}
                valueFormatter={(v) => `Rs ${v}`}
                colors={gmvByCategory.bars.map((b) => b.color)}
              />
            ) : (
              <BarChart values={[0]} labels={["No Data"]} valueFormatter={(v) => `Rs ${v}`} colors={["var(--teal)"]} />
            )}
            <TrendLine gmv values={gmvByCategory.bars.map((b) => b.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>City-wise Performance</h3>
        </div>
        <div className="tbl-wrap">
          <table>
            <tbody>
              <tr>
                <th>City</th>
                <th>Users</th>
                <th>Listings</th>
                <th>GMV</th>
                <th>Avg Price</th>
                <th>Conversion</th>
                <th>Share</th>
              </tr>
              {cityRows.map((row) => (
                <tr key={row.city}>
                  <td>
                    <b>{row.city}</b>
                  </td>
                  <td>{row.users.toLocaleString()}</td>
                  <td>{row.listings.toLocaleString()}</td>
                  <td>{row.gmv}</td>
                  <td>{row.avgListingPrice}</td>
                  <td>{row.conversion}</td>
                  <td>
                    <div className="progress-bar" style={{ width: 120 }}>
                      <div className="progress-fill" style={{ width: `${row.shareWidth}%`, background: row.color }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
