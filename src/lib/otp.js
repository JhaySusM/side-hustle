import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "@/lib/email";

export const OTP_EXPIRY_MS = 10 * 60_000;
export const MAX_OTP_ATTEMPTS = 5;

export function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function hashOtp(code) {
  return bcrypt.hash(code, 10);
}

export async function verifyOtp(code, hash) {
  return bcrypt.compare(code, hash);
}

// Regenerates and emails a fresh OTP for an existing user (login retry /
// resend-otp), resetting attempts and expiry. Registration doesn't use this
// — it sets the OTP fields as part of the initial `create()` instead.
export async function issueAndSendOtp(prisma, user) {
  const code = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationCodeHash: await hashOtp(code),
      emailVerificationExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      emailVerificationAttempts: 0,
    },
  });
  await sendOtpEmail(user.email, code);
}
