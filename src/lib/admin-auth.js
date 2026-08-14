import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "batjee-secret";

function getAdminTokenFromRequest(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|; )batjee_admin_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Deliberately independent of the customer-facing `batjee_token` session
// (see getRequestUser in lib/auth.js) so that authenticating in the admin
// panel never changes which account a regular shopper is browsing as.
export async function isAdminRequest(request) {
  return Boolean(await getAdminUser(request));
}

// Like isAdminRequest, but returns the admin's own user record — used when
// an action needs to attribute itself to a specific admin (e.g. activity logging).
export async function getAdminUser(request) {
  const token = getAdminTokenFromRequest(request);
  if (!token) {
    return null;
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });

  return user && user.user_type === "admin" && user.status === "active" ? user : null;
}
