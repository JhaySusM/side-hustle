"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminData } from "../_context/AdminDataContext";
import { useToast } from "../_components/Toast";

const TRANSACTION_LABELS = {
  earn_referral: "Referral bonus",
  spend_premium_slot: "Premium slot",
  spend_boost: "Ad boost",
  spend_badge: "Referrer badge",
  admin_adjustment: "Admin adjustment",
};

const EMPTY_SETTINGS = {
  referralPointsPerConversion: 100,
  minListingsForConversion: 1,
  fraudDetectionEnabled: true,
  premiumSlotCost: 300,
  premiumSlotDurationDays: 7,
  boostCost: 150,
  boostDurationDays: 3,
  badgeCost: 500,
};

export default function AdminRewardsPage() {
  const { users } = useAdminData();
  const showToast = useToast();

  const [rewardsData, setRewardsData] = useState(null);
  const [form, setForm] = useState(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustBusy, setAdjustBusy] = useState(false);

  async function loadRewards() {
    try {
      const res = await fetch("/api/admin/rewards", { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load rewards data");
      setRewardsData(data);
      setForm(data.settings);
    } catch (err) {
      showToast(`❌ ${err.message}`, "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      await loadRewards();
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usersById = useMemo(() => new Map((users || []).map((u) => [u.id, u])), [users]);

  async function handleSaveSettings() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      setRewardsData((prev) => ({ ...prev, settings: data.settings }));
      showToast("✅ Rewards settings saved.", "ok");
    } catch (err) {
      showToast(`❌ ${err.message}`, "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdjust() {
    const userId = Number(adjustUserId);
    const points = Number(adjustPoints);
    if (!userId || !Number.isFinite(points) || points === 0) {
      showToast("❌ Pick a user and a non-zero point amount.", "err");
      return;
    }

    setAdjustBusy(true);
    try {
      const res = await fetch("/api/admin/rewards/adjust", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, points, note: adjustNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to adjust points");
      showToast(`✅ ${points > 0 ? "Added" : "Removed"} ${Math.abs(points)} pts.`, "ok");
      setAdjustUserId("");
      setAdjustPoints("");
      setAdjustNote("");
      await loadRewards();
    } catch (err) {
      showToast(`❌ ${err.message}`, "err");
    } finally {
      setAdjustBusy(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 40, color: "var(--mut)" }}>Loading rewards...</div>;
  }

  return (
    <div className="referral-shell">
      <div className="referral-card">
        <div className="referral-hero">
          <div className="referral-kicker">Referral Rewards</div>
          <div className="referral-head">
            <div>
              <h3>Points economy for referrals, ad promotions, and profile badges.</h3>
              <p>
                Referrers earn {rewardsData?.settings.referralPointsPerConversion} points once a referred user
                posts at least {rewardsData?.settings.minListingsForConversion} listing
                {rewardsData?.settings.minListingsForConversion === 1 ? "" : "s"}. Points are redeemable for
                premium ad slots, ad boosts, and a profile badge.
              </p>
            </div>
            <div className="referral-chip">Live points ledger</div>
          </div>
        </div>
        <div className="kpi-row">
          <div className="kpi">
            <div className="kv">{(rewardsData?.totalOutstandingPoints || 0).toLocaleString()}</div>
            <div className="kl">Points Outstanding</div>
          </div>
          <div className="kpi">
            <div className="kv">{rewardsData?.activePremiumSlotCount || 0}</div>
            <div className="kl">Active Premium Slots</div>
          </div>
          <div className="kpi">
            <div className="kv">{rewardsData?.activeBoostCount || 0}</div>
            <div className="kl">Active Boosts</div>
          </div>
          <div className="kpi">
            <div className="kv">{rewardsData?.badgeCount || 0}</div>
            <div className="kl">Badges Purchased</div>
          </div>
        </div>
      </div>

      <div className="referral-grid">
        <div className="card referral-panel">
          <div className="referral-panel-head">
            <div>
              <h3>Points Ledger</h3>
              <p>Most recent 100 transactions across all users.</p>
            </div>
          </div>
          <div className="referral-empty-card">
            <div className="referral-empty-table">
              <div className="tbl-wrap">
                <table>
                  <tbody>
                    <tr>
                      <th>User</th>
                      <th>Type</th>
                      <th>Points</th>
                      <th>Balance After</th>
                      <th>Date</th>
                    </tr>
                    {(rewardsData?.transactions || []).length ? (
                      rewardsData.transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.user?.name || tx.user?.email || `User ${tx.userId}`}</td>
                          <td>{TRANSACTION_LABELS[tx.type] || tx.type}</td>
                          <td>
                            <span className={tx.points >= 0 ? "tag tag-ok" : "tag tag-danger"}>
                              {tx.points >= 0 ? "+" : ""}
                              {tx.points}
                            </span>
                          </td>
                          <td>{tx.balanceAfter}</td>
                          <td>{new Date(tx.createdAt).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5}>No points transactions yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="referral-panel-head" style={{ marginTop: 24 }}>
            <div>
              <h3>Manual Adjustment</h3>
              <p>Add or remove points from a user&apos;s balance (e.g. support cases or fraud reversal).</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="form-group" style={{ minWidth: 220 }}>
              <label>User</label>
              <select value={adjustUserId} onChange={(e) => setAdjustUserId(e.target.value)}>
                <option value="">Select a user</option>
                {(users || []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} (#{u.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ width: 140 }}>
              <label>Points (+/-)</label>
              <input
                type="number"
                step={1}
                placeholder="e.g. 100 or -50"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ minWidth: 220, flex: 1 }}>
              <label>Note (optional)</label>
              <input
                type="text"
                placeholder="Reason for adjustment"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-teal" disabled={adjustBusy} onClick={handleAdjust}>
              {adjustBusy ? "Applying..." : "Apply Adjustment"}
            </button>
          </div>
          {adjustUserId && usersById.get(Number(adjustUserId)) ? (
            <div className="referral-settings-note" style={{ marginTop: 8 }}>
              Current balance: {usersById.get(Number(adjustUserId))?.referralPointsBalance ?? "unknown"} pts
            </div>
          ) : null}
        </div>

        <div className="referral-side">
          <div className="card referral-settings">
            <div className="card-h">
              <h3>⚙️ Rewards Settings</h3>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Points Per Converted Referral</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.referralPointsPerConversion}
                onChange={(e) => setForm((prev) => ({ ...prev, referralPointsPerConversion: Math.max(0, Number(e.target.value || 0)) }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Min. Listings to Qualify (Referred User)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.minListingsForConversion}
                onChange={(e) => setForm((prev) => ({ ...prev, minListingsForConversion: Math.max(0, Number(e.target.value || 0)) }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Premium Slot Cost (pts) / Duration (days)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.premiumSlotCost}
                  onChange={(e) => setForm((prev) => ({ ...prev, premiumSlotCost: Math.max(0, Number(e.target.value || 0)) }))}
                />
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.premiumSlotDurationDays}
                  onChange={(e) => setForm((prev) => ({ ...prev, premiumSlotDurationDays: Math.max(1, Number(e.target.value || 0)) }))}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Boost Cost (pts) / Duration (days)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.boostCost}
                  onChange={(e) => setForm((prev) => ({ ...prev, boostCost: Math.max(0, Number(e.target.value || 0)) }))}
                />
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.boostDurationDays}
                  onChange={(e) => setForm((prev) => ({ ...prev, boostDurationDays: Math.max(1, Number(e.target.value || 0)) }))}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Badge Cost (pts)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.badgeCost}
                onChange={(e) => setForm((prev) => ({ ...prev, badgeCost: Math.max(0, Number(e.target.value || 0)) }))}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Fraud Detection</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.fraudDetectionEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, fraudDetectionEnabled: e.target.checked }))}
                />
                <span className="slider" />
              </label>
            </div>
            <button type="button" className="btn btn-teal" style={{ width: "100%" }} disabled={saving} onClick={handleSaveSettings}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
