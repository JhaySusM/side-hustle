import { requireRequestUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSellerOutstandingFeeSummary } from '@/lib/seller-fee-status';

export async function GET(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const feeSummary = await getSellerOutstandingFeeSummary(prisma, user.id);

    return Response.json({
      canPostProduct: !feeSummary.hasOutstandingFees,
      ...feeSummary,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || 'Failed to check posting eligibility' },
      { status: 500 }
    );
  }
}