import jwt from "jsonwebtoken";
import { exchangeGoogleCode, fetchGoogleUser } from "@/lib/oauth-google";
import { findOrCreateOAuthUser } from "@/lib/oauth-users";
import { ensureUserReferralCode } from "@/lib/referrals";
import { toSafeUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "batjee-secret";
const CLEAR_STATE_COOKIE = "oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax";

function failureRedirect(origin, reason) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${origin}/?authError=${reason}`,
      "Set-Cookie": CLEAR_STATE_COOKIE,
    },
  });
}

export async function GET(request) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  const cookieHeader = request.headers.get("cookie") || "";
  const stateMatch = cookieHeader.match(/(?:^|; )oauth_state=([^;]+)/);
  const expectedState = stateMatch ? decodeURIComponent(stateMatch[1]) : null;

  if (!code || !state || !expectedState || state !== expectedState) {
    return failureRedirect(origin, "google_failed");
  }

  try {
    const accessToken = await exchangeGoogleCode(code, origin);
    const googleUser = await fetchGoogleUser(accessToken);

    if (!googleUser.emailVerified) {
      return failureRedirect(origin, "google_email_unverified");
    }

    let user = await findOrCreateOAuthUser({
      provider: "google",
      providerId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
    });
    user = await ensureUserReferralCode(user);
    await logActivity(prisma, {
      userId: user.id,
      action: "login",
      category: "account",
      status: "success",
      detail: "Logged in via Google",
      request,
      metadata: { method: "google" },
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    const headers = new Headers({ Location: `${origin}/dashboard` });
    headers.append("Set-Cookie", `batjee_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`);
    headers.append("Set-Cookie", CLEAR_STATE_COOKIE);

    return new Response(null, { status: 302, headers });
  } catch {
    return failureRedirect(origin, "google_failed");
  }
}
