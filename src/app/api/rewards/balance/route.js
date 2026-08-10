import { prisma } from '@/lib/prisma';
import { requireRequestUser } from '@/lib/auth';

export async function GET(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  const [balanceUser, transactions, badge] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { referralPointsBalance: true },
    }),
    prisma.pointsTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.userBadge.findUnique({ where: { userId: user.id } }),
  ]);

  return Response.json({
    balance: balanceUser?.referralPointsBalance ?? 0,
    transactions,
    hasBadge: Boolean(badge),
  });
}
