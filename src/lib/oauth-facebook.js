const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
const GRAPH_VERSION = "v19.0";

export function facebookRedirectUri(origin) {
  return `${origin}/api/auth/facebook/callback`;
}

export function buildFacebookAuthUrl(origin, state) {
  const params = new URLSearchParams({
    client_id: FACEBOOK_CLIENT_ID,
    redirect_uri: facebookRedirectUri(origin),
    state,
    scope: "email,public_profile",
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeFacebookCode(code, origin) {
  const params = new URLSearchParams({
    client_id: FACEBOOK_CLIENT_ID,
    client_secret: FACEBOOK_CLIENT_SECRET,
    redirect_uri: facebookRedirectUri(origin),
    code,
  });
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to exchange Facebook authorization code");
  }
  const data = await res.json();
  return data.access_token;
}

export async function fetchFacebookUser(accessToken) {
  const params = new URLSearchParams({
    fields: "id,name,email",
    access_token: accessToken,
  });
  const res = await fetch(`https://graph.facebook.com/me?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch Facebook user profile");
  }
  const data = await res.json();
  return {
    id: data.id,
    email: data.email || null,
    name: data.name || "",
  };
}
