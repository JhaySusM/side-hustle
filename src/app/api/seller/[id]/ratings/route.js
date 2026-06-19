import { getRequestUser, requireRequestUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function syncSellerRatingSummary(sellerId) {
  const aggregate = await prisma.sellerRating.aggregate({
    where: { sellerId },
    _avg: { score: true },
    _count: { _all: true },
  });

  const sellerRatingAvg = Number(aggregate._avg.score || 0);
  const sellerRatingCount = Number(aggregate._count._all || 0);

  await prisma.user.update({
    where: { id: sellerId },
    data: {
      sellerRatingAvg,
      sellerRatingCount,
    },
  });

  return { sellerRatingAvg, sellerRatingCount };
}

export async function GET(request, { params }) {
  const { id: rawId } = await params;
  const sellerId = Number(rawId);

  if (!sellerId) {
    return Response.json({ error: 'Invalid seller ID' }, { status: 400 });
  }

  try {
    const viewer = await getRequestUser(request);

    const [summary, recent, viewerRating] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sellerId },
        select: { sellerRatingAvg: true, sellerRatingCount: true },
      }),
      prisma.sellerRating.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          buyer: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      viewer
        ? prisma.sellerRating.findUnique({
            where: {
              buyerId_sellerId: {
                buyerId: viewer.id,
                sellerId,
              },
            },
            select: { score: true, comment: true, createdAt: true },
          })
        : Promise.resolve(null),
    ]);

    return Response.json({
      summary: {
        avg: Number(summary?.sellerRatingAvg || 0),
        count: Number(summary?.sellerRatingCount || 0),
      },
      ratings: recent.map((row) => ({
        id: row.id,
        score: row.score,
        comment: row.comment || '',
        createdAt: row.createdAt,
        buyer: {
          id: row.buyer.id,
          name: row.buyer.name || row.buyer.email,
        },
      })),
      viewerRating: viewerRating
        ? {
            score: viewerRating.score,
            comment: viewerRating.comment || '',
            createdAt: viewerRating.createdAt,
          }
        : null,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch seller ratings' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  const { id: rawId } = await params;
  const sellerId = Number(rawId);

  if (!sellerId) {
    return Response.json({ error: 'Invalid seller ID' }, { status: 400 });
  }

  if (sellerId === user.id) {
    return Response.json({ error: 'You cannot rate yourself' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const score = Number(body.score);
    const comment = body.comment?.trim() || null;

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return Response.json({ error: 'Score must be an integer from 1 to 5' }, { status: 400 });
    }

    const seller = await prisma.user.findUnique({ where: { id: sellerId }, select: { id: true } });
    if (!seller) {
      return Response.json({ error: 'Seller not found' }, { status: 404 });
    }

    const rating = await prisma.sellerRating.upsert({
      where: {
        buyerId_sellerId: {
          buyerId: user.id,
          sellerId,
        },
      },
      update: { score, comment },
      create: {
        buyerId: user.id,
        sellerId,
        score,
        comment,
      },
    });

    const summary = await syncSellerRatingSummary(sellerId);

    return Response.json({
      rating: {
        id: rating.id,
        score: rating.score,
        comment: rating.comment || '',
        createdAt: rating.createdAt,
      },
      summary,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to submit rating' }, { status: 500 });
  }
}
