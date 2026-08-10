import { requireRequestUser } from '@/lib/auth';
import { purchaseBadge } from '@/lib/rewards';

export async function POST(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const badge = await purchaseBadge(user.id);
    return Response.json({ badge });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_POINTS') {
      return Response.json({ error: 'Not enough points' }, { status: 400 });
    }
    if (error.code === 'ALREADY_OWNED') {
      return Response.json({ error: 'Badge already purchased' }, { status: 400 });
    }
    return Response.json({ error: error.message || 'Failed to purchase badge' }, { status: 500 });
  }
}
