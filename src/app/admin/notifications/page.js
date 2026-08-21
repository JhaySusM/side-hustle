"use client";

import { useMemo, useState } from "react";
import { useAdminData } from "../_context/AdminDataContext";
import { useToast } from "../_components/Toast";
import { pickCity, toJoinedDate } from "../_lib/format";

const DEEPLINK_OPTIONS = [
  { value: "home", label: "Home Feed" },
  { value: "/listings?category=Mobiles", label: "Category: Mobiles" },
  { value: "/listings?category=Vehicles", label: "Category: Vehicles" },
  { value: "/listings", label: "Deals Page" },
  { value: "/post", label: "Sell Now" },
];

function formatAudienceLabel(campaign) {
  if (!campaign) return "All Users";
  if (campaign.audienceType === "city") return `City: ${campaign.audienceValue || "Unknown"}`;
  if (campaign.audienceType === "buyers") return "Active Buyers Only";
  if (campaign.audienceType === "sellers") return "Active Sellers Only";
  if (campaign.audienceType === "inactive") return "Inactive 30+ days";
  return "All Users";
}

export default function AdminNotificationsPage() {
  const { users, notificationCampaigns, patchNotificationCampaigns, loading } = useAdminData();
  const showToast = useToast();

  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deepLink, setDeepLink] = useState("home");
  const [sending, setSending] = useState(false);

  const audienceOptions = useMemo(() => {
    const cityCounts = new Map();
    users.forEach((user) => {
      const city = pickCity(user);
      if (!city || city === "Unknown") return;
      cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    });

    const base = [
      { value: "all", label: `All Users (${users.length.toLocaleString()})` },
      { value: "buyers", label: "Active Buyers Only" },
      { value: "sellers", label: "Active Sellers Only" },
      { value: "inactive", label: "Inactive 30+ days" },
    ];

    const cityOptions = [...cityCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([city, count]) => ({ value: `city:${city}`, label: `City: ${city} (${count.toLocaleString()})` }));

    return [...base, ...cityOptions];
  }, [users]);

  const selectedLabel = audienceOptions.find((o) => o.value === audience)?.label || "All Users";
  const audienceMeta = selectedLabel.replace(/\s*\([^)]*\)\s*$/, "");

  async function handleSend() {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      showToast("❌ Please enter title and message body before sending.", "danger");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, body: trimmedBody, deepLink, audience }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to queue notification");

      patchNotificationCampaigns(() => payload.campaigns || []);
      showToast(`✅ Notification queued for ${Number(payload.recipientCount || 0).toLocaleString()} users (${selectedLabel}).`, "ok");
    } catch (error) {
      showToast(`❌ ${error.message || "Failed to queue notification"}`, "danger");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 40, color: "var(--mut)" }}>Loading notifications...</div>;
  }

  return (
    <div className="notifications-shell">
      <div className="card notification-compose-card">
        <div className="notification-compose-head">
          <div className="notification-compose-kicker">Broadcast Studio</div>
          <div className="notification-compose-title">
            <div>
              <h3>Build sharper campaigns with live mobile preview.</h3>
              <p>Compose the message, select the audience, and review delivery context from one screen before sending.</p>
            </div>
            <div className="notification-compose-badge">Delivery ready</div>
          </div>
        </div>
        <div className="notification-compose-body">
          <div className="notification-form-grid">
            <div className="notification-field full">
              <label>Audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                {audienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="notification-field full">
              <label>Title</label>
              <input
                placeholder="e.g. 🔥 New deals in your city!"
                maxLength={65}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="field-hint">Keep it within 65 characters for a cleaner lock-screen preview.</div>
            </div>
            <div className="notification-field full">
              <label>Message Body</label>
              <textarea
                rows={4}
                placeholder="Fresh listings just dropped. Tap to explore..."
                maxLength={120}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <div className="field-hint">Use concise copy. Most users will only read the first two lines.</div>
            </div>
            <div className="notification-field">
              <label>Deep Link</label>
              <select value={deepLink} onChange={(e) => setDeepLink(e.target.value)}>
                {DEEPLINK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="notification-field">
              <label>Schedule</label>
              {/* TODO: "Schedule for Later" is not wired to anything — carried over
                  from admin-backoffice.html, which also never implemented it. */}
              <select>
                <option>Send Immediately</option>
                <option>Schedule for Later</option>
              </select>
            </div>
          </div>
          <div className="notification-actions">
            {/* TODO: "Save Draft" has no handler in admin-backoffice.html either — dead button carried over as-is. */}
            <button type="button" className="btn btn-outline">
              Save Draft
            </button>
            <button type="button" className="btn btn-teal" onClick={handleSend} disabled={sending}>
              {sending ? "Sending..." : "🚀 Send Push"}
            </button>
          </div>
        </div>
      </div>

      <div className="notification-side">
        <div className="card notification-side-card">
          <div className="card-h">
            <h3>📱 Live Preview</h3>
          </div>
          <div className="notification-phone-stage">
            <div className="notification-phone">
              <div className="notification-phone-screen">
                <div className="notification-app-icon">🛍️</div>
                <div className="notification-preview-copy">
                  <div className="notification-preview-app">MaalX</div>
                  <div className="notification-preview-title">{title || "MaalX"}</div>
                  <div className="notification-preview-body">{body || "Your notification preview will appear here."}</div>
                  <div className="notification-preview-time">now</div>
                </div>
              </div>
            </div>
            <div className="notification-meta-strip">
              <div className="notification-meta-chip">
                <div className="k">Audience</div>
                <div className="v">{audienceMeta}</div>
              </div>
              <div className="notification-meta-chip">
                <div className="k">Status</div>
                <div className="v">Drafting</div>
              </div>
              <div className="notification-meta-chip">
                <div className="k">Channel</div>
                <div className="v">Push</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card notification-side-card">
          <div className="card-h">
            <h3>📋 Recent Campaigns</h3>
          </div>
          <div className="notification-campaign-list">
            {!notificationCampaigns.length ? (
              <div style={{ color: "var(--mut)", fontSize: 13, padding: "8px 0" }}>No campaigns yet.</div>
            ) : (
              notificationCampaigns.slice(0, 6).map((campaign, index) => {
                const openRate = Number(campaign.openRate || 0);
                const sentCount = Number(campaign.sentCount || 0).toLocaleString();
                return (
                  <div className="notification-campaign-item" key={campaign.id ?? index}>
                    <div>
                      <div className="notification-campaign-name">{campaign.title}</div>
                      <div className="notification-campaign-sub">
                        {formatAudienceLabel(campaign)} · {toJoinedDate(campaign.createdAt)}
                      </div>
                      <div className="notification-campaign-tags">
                        <span className="notification-campaign-tag">{campaign.deepLink || "home"}</span>
                        <span className="notification-campaign-tag">{sentCount} recipients</span>
                      </div>
                    </div>
                    <div className="notification-campaign-stats">
                      <div className="notification-campaign-open">
                        {openRate.toFixed(1)}
                        <span>% open</span>
                      </div>
                      <div className="notification-campaign-sent">{sentCount} sent</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
