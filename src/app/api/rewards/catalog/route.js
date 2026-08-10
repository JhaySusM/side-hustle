import { getRewardsSettings } from '@/lib/rewards';

export async function GET() {
  const settings = await getRewardsSettings();

  return Response.json({
    referralPointsPerConversion: settings.referralPointsPerConversion,
    premiumSlot: {
      cost: settings.premiumSlotCost,
      durationDays: settings.premiumSlotDurationDays,
    },
    boost: {
      cost: settings.boostCost,
      durationDays: settings.boostDurationDays,
    },
    badge: {
      cost: settings.badgeCost,
    },
  });
}
