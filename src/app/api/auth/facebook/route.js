import crypto from "crypto";
import { buildFacebookAuthUrl } from "@/lib/oauth-facebook";

export async function GET(request) {
  const origin = request.nextUrl.origin;
  const state = crypto.randomBytes(16).toString("hex");
  const url = buildFacebookAuthUrl(origin, state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "Set-Cookie": `oauth_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`,
    },
  });
}
