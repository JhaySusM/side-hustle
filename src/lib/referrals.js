import { prisma } from "@/lib/prisma";

const REFERRAL_RANDOM_LENGTH = 6;

function sanitizeReferralChunk(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function randomReferralChunk(length) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let output = "";

  for (let index = 0; index < length; index += 1) {
    output += chars[Math.floor(Math.random() * chars.length)];
  }

  return output;
}

function buildReferralPrefix({ name, email }) {
  const preferred = sanitizeReferralChunk(name).slice(0, 4);
  if (preferred.length >= 3) {
    return preferred;
  }

  const emailPrefix = sanitizeReferralChunk(String(email || "").split("@")[0]).slice(0, 4);
  if (emailPrefix.length >= 3) {
    return emailPrefix;
  }

  return "TGO";
}

export function normalizeReferralCode(value) {
  return sanitizeReferralChunk(value).slice(0, 24);
}

export async function generateUniqueReferralCode(userLike) {
  const prefix = buildReferralPrefix(userLike);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `${prefix}${randomReferralChunk(REFERRAL_RANDOM_LENGTH)}`;
    const existing = await prisma.user.findUnique({
      where: { referralCode: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Unable to generate unique referral code");
}

export async function ensureUserReferralCode(user) {
  if (!user) {
    return null;
  }

  if (user.referralCode) {
    return user;
  }

  const referralCode = await generateUniqueReferralCode(user);

  return prisma.user.update({
    where: { id: user.id },
    data: { referralCode },
  });
}