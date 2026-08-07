import { pickCity, toPkCurrency } from "./format";

export function buildReferralMetrics(users, products, settings) {
  const allUsers = Array.isArray(users) ? users : [];
  const allProducts = Array.isArray(products) ? products : [];
  const listingsByUserId = allProducts.reduce((map, product) => {
    const userId = Number(product?.user_id || product?.user?.id || 0);
    if (!userId) return map;
    map.set(userId, (map.get(userId) || 0) + 1);
    return map;
  }, new Map());

  const referredUsers = allUsers
    .filter((user) => Number(user?.referredById || 0) > 0)
    .map((user) => {
      const listings = listingsByUserId.get(Number(user.id)) || 0;
      const converted = listings >= settings.minListings;
      const createdAt = user?.createdAt ? new Date(user.createdAt) : null;
      const suspicious =
        settings.fraudDetection &&
        createdAt &&
        Date.now() - createdAt.getTime() < 24 * 60 * 60 * 1000 &&
        listings === 0;
      return { ...user, listings, converted, suspicious };
    });

  const referrerMap = new Map();
  referredUsers.forEach((user) => {
    const referrerId = Number(user.referredById || 0);
    const referrer = allUsers.find((item) => Number(item.id) === referrerId);
    if (!referrer) return;
    const current = referrerMap.get(referrerId) || {
      id: referrerId,
      name: referrer.name || referrer.email || "Unknown User",
      email: referrer.email || "—",
      city: pickCity(referrer),
      referralCode: referrer.referralCode || "—",
      referrals: 0,
      converted: 0,
      suspicious: 0,
    };
    current.referrals += 1;
    if (user.converted) current.converted += 1;
    if (user.suspicious) current.suspicious += 1;
    referrerMap.set(referrerId, current);
  });

  const topReferrers = [...referrerMap.values()]
    .map((item) => {
      const rewards = item.converted * settings.rewardAmount;
      const rate = item.referrals > 0 ? (item.converted / item.referrals) * 100 : 0;
      return {
        ...item,
        rewards,
        rate,
        status: item.suspicious > 0 ? "Review" : item.converted > 0 ? "Payable" : "Tracking",
      };
    })
    .sort((a, b) => b.converted - a.converted || b.referrals - a.referrals || a.name.localeCompare(b.name));

  const totalRewards = topReferrers.reduce((sum, item) => sum + item.rewards, 0);
  const averageReward = topReferrers.length ? totalRewards / topReferrers.length : 0;
  const convertedCount = referredUsers.filter((item) => item.converted).length;
  const conversionRate = referredUsers.length ? (convertedCount / referredUsers.length) * 100 : 0;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthlyReferrals = referredUsers.filter((item) => {
    const createdAt = item?.createdAt ? new Date(item.createdAt).getTime() : NaN;
    return Number.isFinite(createdAt) && createdAt >= monthStart.getTime();
  }).length;
  const monthlyConversions = referredUsers.filter((item) => {
    const createdAt = item?.createdAt ? new Date(item.createdAt).getTime() : NaN;
    return Number.isFinite(createdAt) && createdAt >= monthStart.getTime() && item.converted;
  }).length;
  const monthlyRewards = monthlyConversions * settings.rewardAmount;
  const fraudBlocked = referredUsers.filter((item) => item.suspicious).length;

  return {
    totalReferrers: topReferrers.length,
    referredUsers: referredUsers.length,
    avgReward: averageReward,
    rewardsReleased: totalRewards,
    conversionRate,
    topReferrers,
    month: {
      referrals: monthlyReferrals,
      conversions: monthlyConversions,
      rewards: monthlyRewards,
      fraudBlocked,
    },
  };
}

export function buildReferralMonthRows(metrics) {
  const base = Math.max(metrics.referredUsers || 0, 1);
  return [
    {
      label: "New Referrals",
      value: metrics.month.referrals,
      fill: Math.min(100, Math.round((metrics.month.referrals / base) * 100)),
      color: "var(--teal)",
    },
    {
      label: "Conversions",
      value: metrics.month.conversions,
      fill: Math.min(100, Math.round((metrics.month.conversions / base) * 100)),
      color: "var(--ok)",
    },
    {
      label: "Rewards Paid",
      value: toPkCurrency(metrics.month.rewards),
      fill: Math.min(100, Math.round((metrics.month.conversions / base) * 100)),
      color: "var(--warn)",
    },
    {
      label: "Fraud Blocked",
      value: metrics.month.fraudBlocked,
      fill: Math.min(100, Math.round((metrics.month.fraudBlocked / base) * 100)),
      color: "var(--danger)",
    },
  ];
}
