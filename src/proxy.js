import { NextResponse } from "next/server";

// Path prefixes commonly probed by vulnerability scanners/bots.
// Real users never hit these, so any request here is treated as hostile.
const BLOCKED_PATH_PATTERNS = [
  /^\/wp-admin/i,
  /^\/wp-login/i,
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/phpmyadmin/i,
  /^\/xmlrpc\.php/i,
  /^\/vendor\/.*\.php$/i,
  /^\/(config|settings)\.(php|json|yml|yaml)$/i,
];

// Comma-separated IPs, set via BLOCKED_IPS env var (e.g. "1.2.3.4,5.6.7.8").
const BLOCKED_IPS = new Set(
  (process.env.BLOCKED_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean)
);

// path prefix -> { windowMs, max, method? }
// `method` restricts the rule to one HTTP method — needed for prefixes like
// /api/users that are shared with admin-only GET/PUT/DELETE routes.
const RATE_LIMITS = [
  { prefix: "/api/auth/login", windowMs: 60_000, max: 10 },
  { prefix: "/api/messages/support", windowMs: 60_000, max: 20 },
  { prefix: "/api/reports", windowMs: 60_000, max: 10 },
  { prefix: "/api/users", method: "POST", windowMs: 10 * 60_000, max: 5 },
  { prefix: "/api/auth/resend-otp", windowMs: 5 * 60_000, max: 3 },
  { prefix: "/api/auth/verify-otp", windowMs: 5 * 60_000, max: 20 },
  { prefix: "/api/auth/google", windowMs: 60_000, max: 20 },
  { prefix: "/api/auth/facebook", windowMs: 60_000, max: 20 },
  { prefix: "/api/auth/whatsapp/start", windowMs: 10 * 60_000, max: 5 },
  { prefix: "/api/auth/whatsapp/resend", windowMs: 5 * 60_000, max: 3 },
  { prefix: "/api/auth/whatsapp/verify", windowMs: 5 * 60_000, max: 20 },
];

// In-memory sliding-window counters, keyed by "ip:prefix".
// Resets on server restart and is per-instance only (fine for a single
// Node.js process; won't be shared across multiple instances/replicas).
const hits = new Map();

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip, prefix, windowMs, max) {
  const key = `${ip}:${prefix}`;
  const now = Date.now();
  const timestamps = (hits.get(key) || []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  hits.set(key, timestamps);
  return timestamps.length > max;
}

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  if (BLOCKED_IPS.has(ip)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = RATE_LIMITS.find(
    (rule) =>
      pathname.startsWith(rule.prefix) && (!rule.method || rule.method === request.method)
  );
  if (limit && isRateLimited(ip, limit.prefix, limit.windowMs, limit.max)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.windowMs / 1000)) } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
