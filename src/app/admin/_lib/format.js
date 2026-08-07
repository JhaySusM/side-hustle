import { getUserCity } from "@/lib/address";

export function toPkCurrency(amount) {
  const value = Number(amount || 0);
  return `Rs ${Math.round(value).toLocaleString()}`;
}

export function toJoinedDate(dateValue) {
  const date = dateValue ? new Date(dateValue) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

export function toRelativeTime(value) {
  const ts = value ? new Date(value).getTime() : NaN;
  if (!Number.isFinite(ts)) return "—";
  const diff = Date.now() - ts;
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.round(diff / (60 * 1000)))}m ago`;
  if (diff < day) return `${Math.round(diff / hour)}h ago`;
  return `${Math.round(diff / day)}d ago`;
}

export function formatCompact(value) {
  const n = Number(value || 0);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export function percentDelta(current, previous) {
  if (!Number.isFinite(previous) || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

export function formatSignedDelta(delta, unit = "%") {
  if (!Number.isFinite(delta)) return `0${unit}`;
  const sign = delta >= 0 ? "▲" : "▼";
  return `${sign} ${Math.abs(delta).toFixed(1)}${unit}`;
}

// pickCity() in the old admin-backoffice.html duplicated this logic with a
// 'Unknown' fallback instead of ''. Reuse the shared helper instead of a
// second copy.
export function pickCity(user) {
  return getUserCity(user) || "Unknown";
}

export function prettifyReportType(type) {
  return (
    String(type || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase()) || "Report"
  );
}

export function reportPriorityTag(priority) {
  if (priority === "high") return "tag-danger";
  if (priority === "low") return "tag-muted";
  return "tag-warn";
}

export function reportStatusTag(status) {
  if (status === "resolved") return "tag-ok";
  if (status === "dismissed") return "tag-muted";
  return "tag-warn";
}

export function isSameDay(value, now = new Date()) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
