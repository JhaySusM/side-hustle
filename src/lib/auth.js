import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "batjee-secret";

function getTokenFromRequest(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|; )batjee_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getRequestUser(request) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      name: true,
      user_type: true,
      status: true,
      emailVerifiedAt: true,
      phone: true,
      phoneVerifiedAt: true,
      googleId: true,
      facebookId: true,
    },
  });
}

export function toSafeUser(user) {
  if (!user) return user;
  const {
    password,
    emailVerificationCodeHash,
    emailVerificationExpiresAt,
    emailVerificationAttempts,
    phoneVerificationCodeHash,
    phoneVerificationExpiresAt,
    phoneVerificationAttempts,
    googleId,
    facebookId,
    ...safeUser
  } = user;
  return {
    ...safeUser,
    googleLinked: Boolean(googleId),
    facebookLinked: Boolean(facebookId),
  };
}

export async function requireRequestUser(request) {
  const user = await getRequestUser(request);
  if (!user) {
    return {
      errorResponse: Response.json({ error: "Not authenticated" }, { status: 401 }),
      user: null,
    };
  }

  if (user.status && user.status !== "active") {
    return {
      errorResponse: Response.json({ error: "Account is inactive" }, { status: 403 }),
      user: null,
    };
  }

  if (!user.emailVerifiedAt && !user.phoneVerifiedAt) {
    return {
      errorResponse: Response.json({ error: "Email not verified" }, { status: 403 }),
      user: null,
    };
  }

  return { errorResponse: null, user };
}