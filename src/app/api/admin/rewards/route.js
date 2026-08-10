import { isAdminRequest } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getRewardsSettings, PROMOTION_TYPES } from '@/lib/rewards';

const SETTINGS_FIELDS = [
  'referralPointsPerConversion',
  'minListingsForConversion',
  'fraudDetectionEnabled',
  'premiumSlotCost',
  'premiumSlotDurationDays',
  'boostCost',
  'boostDurationDays',
  'badgeCost',
];

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [settings, transactions, activePromotions, badgeCount, balanceAgg] = await Promise.all([
      getRewardsSettings(),
      prisma.pointsTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.productPromotion.findMany({
        where: { endsAt: { gt: new Date() } },
        orderBy: { endsAt: 'desc' },
        include: { product: { select: { id: true, product_name: true, user: { select: { id: true, name: true, email: true } } } } },
      }),
      prisma.userBadge.count(),
      prisma.user.aggregate({ _sum: { referralPointsBalance: true } }),
    ]);

    return Response.json({
      settings,
      transactions,
      activePromotions,
      badgeCount,
      totalOutstandingPoints: balanceAgg._sum.referralPointsBalance || 0,
      activePremiumSlotCount: activePromotions.filter((p) => p.promotionType === PROMOTION_TYPES.PREMIUM_SLOT).length,
      activeBoostCount: activePromotions.filter((p) => p.promotionType === PROMOTION_TYPES.BOOST).length,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch rewards data' }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = {};

    for (const field of SETTINGS_FIELDS) {
      if (body[field] === undefined) continue;
      data[field] = field === 'fraudDetectionEnabled' ? Boolean(body[field]) : Math.max(0, Number(body[field]) || 0);
    }

    const settings = await prisma.rewardsSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    return Response.json({ settings });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to update rewards settings' }, { status: 500 });
  }
}
