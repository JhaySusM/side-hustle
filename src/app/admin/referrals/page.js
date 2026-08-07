"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminData } from "../_context/AdminDataContext";
import { useToast } from "../_components/Toast";
import { buildReferralMetrics, buildReferralMonthRows } from "../_lib/deriveReferrals";
import { DEFAULT_REFERRAL_SETTINGS, getReferralSettings, persistReferralSettings } from "../_lib/referralSettings";
import { toPkCurrency } from "../_lib/format";

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = filename;
  a.click();
}

export default function AdminReferralsPage() {
  const { users, products, loading } = useAdminData();
  const showToast = useToast();
  const [settings, setSettings] = useState(DEFAULT_REFERRAL_SETTINGS);
  const [form, setForm] = useState(DEFAULT_REFERRAL_SETTINGS);

  useEffect(() => {
    const stored = getReferralSettings();
    setSettings(stored);
    setForm(stored);
  }, []);

  const metrics = useMemo(() => buildReferralMetrics(users, products, settings), [users, products, settings]);
  const monthRows = useMemo(() => buildReferralMonthRows(metrics), [metrics]);
  const hasData = metrics.referredUsers > 0;

  function handleSave() {
    persistReferralSettings(form);
    setSettings(form);
    showToast("✅ Referral settings saved. Dashboard metrics updated.", "ok");
  }

  function handleExport() {
    downloadCsv("tradigo_referrals.csv", [
      ["User", "Email", "Referral Code", "City", "Referrals", "Converted", "Rate", "Rewards", "Status"],
      ...metrics.topReferrers.map((item) => [
        item.name,
        item.email,
        item.referralCode,
        item.city,
        item.referrals,
        item.converted,
        `${item.rate.toFixed(1)}%`,
        toPkCurrency(item.rewards),
        item.status,
      ]),
    ]);
  }

  if (loading) {
    return <div style={{ padding: 40, color: "var(--mut)" }}>Loading referrals...</div>;
  }

  return (
    <div className="referral-shell">
      <div className="referral-card">
        <div className="referral-hero">
          <div className="referral-kicker">Referral Growth Desk</div>
          <div className="referral-head">
            <div>
              <h3>Track referral adoption, rewards, and fraud checks from one place.</h3>
              <p>
                {hasData
                  ? `Tracking ${metrics.referredUsers.toLocaleString()} referred users and ${metrics.totalReferrers.toLocaleString()} active referrers with the current qualification rules.`
                  : "The referral program is connected, but there are no referred accounts yet. Share a few invite links to start filling this dashboard."}
              </p>
            </div>
            <div className="referral-chip">{hasData ? "Live referral feed active" : "No referrals yet"}</div>
          </div>
        </div>
        <div className="kpi-row">
          <div className="kpi">
            <div className="kv">{metrics.totalReferrers.toLocaleString()}</div>
            <div className="kl">Total Referrers</div>
          </div>
          <div className="kpi">
            <div className="kv">{metrics.referredUsers.toLocaleString()}</div>
            <div className="kl">Referred Users</div>
          </div>
          <div className="kpi">
            <div className="kv">{toPkCurrency(metrics.avgReward)}</div>
            <div className="kl">Avg Reward Paid</div>
          </div>
          <div className="kpi">
            <div className="kv">{toPkCurrency(metrics.rewardsReleased)}</div>
            <div className="kl">Rewards Released</div>
          </div>
          <div className="kpi">
            <div className="kv">{metrics.conversionRate.toFixed(1)}%</div>
            <div className="kl">Conversion Rate</div>
          </div>
        </div>
      </div>

      <div className="referral-grid">
        <div className="card referral-panel">
          <div className="referral-panel-head">
            <div>
              <h3>Top Referrers</h3>
              <p>
                {hasData
                  ? "Highest-performing advocates ranked by qualified referrals and reward impact."
                  : "Invite activity will populate this leaderboard automatically as new referred accounts sign up."}
              </p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleExport}>
              Export
            </button>
          </div>
          <div className="referral-empty-card">
            <strong>{hasData ? "Referral leaderboard is live." : "No referral leaderboard yet."}</strong>
            <p>
              {hasData
                ? `Qualified referrals currently require at least ${settings.minListings} listing${settings.minListings === 1 ? "" : "s"} to release a reward of ${toPkCurrency(settings.rewardAmount)}.`
                : "Once the referral program begins collecting invitations, conversions, and rewards, this panel can highlight top referrers and flag suspicious accounts for review."}
            </p>
            <div className="referral-empty-table">
              <div className="tbl-wrap">
                <table>
                  <tbody>
                    <tr>
                      <th>User</th>
                      <th>Referrals</th>
                      <th>Converted</th>
                      <th>Rate</th>
                      <th>Rewards</th>
                      <th>Status</th>
                    </tr>
                    {metrics.topReferrers.length ? (
                      metrics.topReferrers.slice(0, 8).map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="flex">
                              <div className="avatar" style={{ background: "#0a6e6e" }}>
                                {item.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.name}</div>
                                <div style={{ fontSize: 11, color: "var(--mut)" }}>
                                  {item.referralCode} · {item.city}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{item.referrals}</td>
                          <td>{item.converted}</td>
                          <td>{item.rate.toFixed(1)}%</td>
                          <td>{toPkCurrency(item.rewards)}</td>
                          <td>
                            <span
                              className={`tag ${item.status === "Review" ? "tag-danger" : item.status === "Payable" ? "tag-ok" : "tag-info"}`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>No referral data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="referral-side">
          <div className="card referral-settings">
            <div className="card-h">
              <h3>⚙️ Program Settings</h3>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Reward Per Successful Referral</label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="Set reward amount"
                value={form.rewardAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, rewardAmount: Math.max(0, Number(e.target.value || 0)) }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Min. Listings to Qualify (Referred User)</label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="Set minimum listing count"
                value={form.minListings}
                onChange={(e) => setForm((prev) => ({ ...prev, minListings: Math.max(0, Number(e.target.value || 0)) }))}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Fraud Detection</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.fraudDetection}
                  onChange={(e) => setForm((prev) => ({ ...prev, fraudDetection: e.target.checked }))}
                />
                <span className="slider" />
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Program Active</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.programActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, programActive: e.target.checked }))}
                />
                <span className="slider" />
              </label>
            </div>
            <button type="button" className="btn btn-teal" style={{ width: "100%" }} onClick={handleSave}>
              Save Settings
            </button>
            <div className="referral-settings-note">
              {settings.programActive
                ? `Program is active. Rewards release at ${toPkCurrency(settings.rewardAmount)} once a referred user reaches ${settings.minListings} listing${settings.minListings === 1 ? "" : "s"}.`
                : "Program is paused. Settings are saved and will apply once you reactivate referrals."}
            </div>
          </div>

          <div className="card referral-month-card">
            <div className="card-h">
              <h3>📊 This Month</h3>
            </div>
            <div className="referral-month-empty">
              {monthRows.map((row) => (
                <div className="referral-month-row" key={row.label}>
                  <div className="top">
                    <span>{row.label}</span>
                    <span>{row.value}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${row.fill}%`, background: row.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
