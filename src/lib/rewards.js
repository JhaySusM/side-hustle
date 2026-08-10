import { prisma } from "@/lib/prisma";

export const POINTS_TRANSACTION_TYPES = {
  EARN_REFERRAL: "earn_referral",
  SPEND_PREMIUM_SLOT: "spend_premium_slot",
  SPEND_BOOST: "spend_boost",
  SPEND_BADGE: "spend_badge",
  ADMIN_ADJUSTMENT: "admin_adjustment",
};

export const PROMOTION_TYPES = {
  PREMIUM_SLOT: "premium_slot",
  BOOST: "boost",
};

const DEFAULT_SETTINGS = {
  id: 1,
  referralPointsPerConversion: 100,
  minListingsForConversion: 1,
  fraudDetectionEnabled: true,
  premiumSlotCost: 300,
  premiumSlotDurationDays: 7,
  boostCost: 150,
  boostDurationDays: 3,
  badgeCost: 500,
};

export async function getRewardsSettings() {
  const settings = await prisma.rewardsSettings.upsert({
    where: { id: 1 },
    update: {},
    create: DEFAULT_SETTINGS,
  });
  return settings;
}

export async function creditReferralConversion(referredUserId) {
  const referredUser = await prisma.user.findUnique({
    where: { id: referredUserId },
    select: { id: true, referredById: true, referralConversionCreditedAt: true },
  });

  if (!referredUser || !referredUser.referredById || referredUser.referralConversionCreditedAt) {
    return null;
  }

  const settings = await getRewardsSettings();
  const listingCount = await prisma.productList.count({ where: { user_id: referredUserId } });

  if (listingCount < settings.minListingsForConversion) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const alreadyCredited = await tx.user.findUnique({
      where: { id: referredUserId },
      select: { referralConversionCreditedAt: true },
    });
    if (alreadyCredited?.referralConversionCreditedAt) {
      return null;
    }

    const referrer = await tx.user.update({
      where: { id: referredUser.referredById },
      data: { referralPointsBalance: { increment: settings.referralPointsPerConversion } },
      select: { id: true, referralPointsBalance: true },
    });

    await tx.pointsTransaction.create({
      data: {
        userId: referrer.id,
        type: POINTS_TRANSACTION_TYPES.EARN_REFERRAL,
        points: settings.referralPointsPerConversion,
        balanceAfter: referrer.referralPointsBalance,
        referenceId: referredUserId,
      },
    });

    await tx.user.update({
      where: { id: referredUserId },
      data: { referralConversionCreditedAt: new Date() },
    });

    return referrer;
  });
}

async function debitPoints(db, { userId, amount, type, referenceId }) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid point amount");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { referralPointsBalance: true },
  });

  if (!user || user.referralPointsBalance < amount) {
    const error = new Error("Insufficient points balance");
    error.code = "INSUFFICIENT_POINTS";
    throw error;
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { referralPointsBalance: { decrement: amount } },
    select: { referralPointsBalance: true },
  });

  await db.pointsTransaction.create({
    data: {
      userId,
      type,
      points: -amount,
      balanceAfter: updated.referralPointsBalance,
      referenceId: referenceId ?? null,
    },
  });

  return updated.referralPointsBalance;
}

export async function spendPoints({ userId, amount, type, referenceId }) {
  return prisma.$transaction((tx) => debitPoints(tx, { userId, amount, type, referenceId }));
}

export async function purchaseProductPromotion({ userId, productId, promotionType }) {
  const settings = await getRewardsSettings();

  const costByType = {
    [PROMOTION_TYPES.PREMIUM_SLOT]: settings.premiumSlotCost,
    [PROMOTION_TYPES.BOOST]: settings.boostCost,
  };
  const durationByType = {
    [PROMOTION_TYPES.PREMIUM_SLOT]: settings.premiumSlotDurationDays,
    [PROMOTION_TYPES.BOOST]: settings.boostDurationDays,
  };
  const spendTypeByPromotion = {
    [PROMOTION_TYPES.PREMIUM_SLOT]: POINTS_TRANSACTION_TYPES.SPEND_PREMIUM_SLOT,
    [PROMOTION_TYPES.BOOST]: POINTS_TRANSACTION_TYPES.SPEND_BOOST,
  };

  const cost = costByType[promotionType];
  const durationDays = durationByType[promotionType];
  if (!cost || !durationDays) {
    throw new Error("Invalid promotion type");
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.productList.findUnique({
      where: { id: productId },
      select: { id: true, user_id: true },
    });

    if (!product || product.user_id !== userId) {
      const error = new Error("Listing not found");
      error.code = "NOT_FOUND";
      throw error;
    }

    await debitPoints(tx, {
      userId,
      amount: cost,
      type: spendTypeByPromotion[promotionType],
      referenceId: productId,
    });

    const now = new Date();
    const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    return tx.productPromotion.create({
      data: {
        productId,
        promotionType,
        pointsSpent: cost,
        startsAt: now,
        endsAt,
      },
    });
  });
}

export async function purchaseBadge(userId) {
  const settings = await getRewardsSettings();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.userBadge.findUnique({ where: { userId } });
    if (existing) {
      const error = new Error("Badge already purchased");
      error.code = "ALREADY_OWNED";
      throw error;
    }

    await debitPoints(tx, {
      userId,
      amount: settings.badgeCost,
      type: POINTS_TRANSACTION_TYPES.SPEND_BADGE,
    });

    return tx.userBadge.create({
      data: { userId, pointsSpent: settings.badgeCost },
    });
  });
}

export function isPromotionActive(promotion, now = new Date()) {
  if (!promotion?.endsAt) {
    return false;
  }
  const endsAt = new Date(promotion.endsAt);
  if (Number.isNaN(endsAt.getTime())) {
    return false;
  }
  return endsAt.getTime() > now.getTime();
}

export function attachProductPromotionState(product) {
  const activePromotions = (product?.promotions || []).filter((promotion) => isPromotionActive(promotion));
  const isPremiumListing = activePromotions.some((p) => p.promotionType === PROMOTION_TYPES.PREMIUM_SLOT);
  const isBoostedListing = activePromotions.some((p) => p.promotionType === PROMOTION_TYPES.BOOST);

  return {
    ...product,
    isPremiumListing,
    isBoostedListing,
  };
}

export function compareProductsByPromotion(left, right) {
  const leftPremium = left?.isPremiumListing ? 1 : 0;
  const rightPremium = right?.isPremiumListing ? 1 : 0;
  if (leftPremium !== rightPremium) {
    return rightPremium - leftPremium;
  }

  const leftBoosted = left?.isBoostedListing ? 1 : 0;
  const rightBoosted = right?.isBoostedListing ? 1 : 0;
  if (leftBoosted !== rightBoosted) {
    return rightBoosted - leftBoosted;
  }

  return 0;
}

export function attachUserBadgeState(user) {
  if (!user) {
    return user;
  }
  return {
    ...user,
    hasReferrerBadge: Boolean(user.badge),
  };
}

export async function adminAdjustPoints({ userId, points, note }) {
  if (!Number.isFinite(points) || points === 0) {
    throw new Error("Invalid point amount");
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { referralPointsBalance: true } });
    if (!user) {
      const error = new Error("User not found");
      error.code = "NOT_FOUND";
      throw error;
    }

    if (points < 0 && user.referralPointsBalance + points < 0) {
      const error = new Error("Insufficient points balance");
      error.code = "INSUFFICIENT_POINTS";
      throw error;
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: { referralPointsBalance: { increment: points } },
      select: { referralPointsBalance: true },
    });

    return tx.pointsTransaction.create({
      data: {
        userId,
        type: POINTS_TRANSACTION_TYPES.ADMIN_ADJUSTMENT,
        points,
        balanceAfter: updated.referralPointsBalance,
        metadata: note ? { note } : undefined,
      },
    });
  });
}
