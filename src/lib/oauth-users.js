import { prisma } from "@/lib/prisma";
import { generateUniqueReferralCode } from "@/lib/referrals";

const PROVIDER_COLUMN = {
  google: "googleId",
  facebook: "facebookId",
};

// Finds the user for a Google/Facebook sign-in, linking or creating as needed.
// - Existing provider id -> that's the login.
// - Existing account with the same (provider-verified) email -> link the
//   provider id onto it, since the provider already confirmed ownership.
// - Otherwise -> create a new, password-less account.
export async function findOrCreateOAuthUser({ provider, providerId, email, name }) {
  const column = PROVIDER_COLUMN[provider];
  if (!column) {
    throw new Error(`Unknown OAuth provider: ${provider}`);
  }

  const byProvider = await prisma.user.findUnique({ where: { [column]: providerId } });
  if (byProvider) {
    return byProvider;
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error(`${provider} did not provide an email address`);
  }

  const byEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        [column]: providerId,
        emailVerifiedAt: byEmail.emailVerifiedAt || new Date(),
      },
    });
  }

  const referralCode = await generateUniqueReferralCode({ name, email: normalizedEmail });

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name || null,
      password: null,
      user_type: "user",
      status: "active",
      emailVerifiedAt: new Date(),
      referralCode,
      [column]: providerId,
    },
  });
}
