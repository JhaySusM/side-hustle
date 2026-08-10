import { requireRequestUser } from '@/lib/auth';
import { purchaseProductPromotion, PROMOTION_TYPES } from '@/lib/rewards';

export async function POST(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  const body = await request.json().catch(() => ({}));
  const productId = Number(body.productId);
  if (!productId) {
    return Response.json({ error: 'productId is required' }, { status: 400 });
  }

  try {
    const promotion = await purchaseProductPromotion({
      userId: user.id,
      productId,
      promotionType: PROMOTION_TYPES.BOOST,
    });
    return Response.json({ promotion });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_POINTS') {
      return Response.json({ error: 'Not enough points' }, { status: 400 });
    }
    if (error.code === 'NOT_FOUND') {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }
    return Response.json({ error: error.message || 'Failed to boost listing' }, { status: 500 });
  }
}
