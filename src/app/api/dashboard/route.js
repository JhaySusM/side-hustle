import { prisma } from '@/lib/prisma';
import { requireRequestUser } from '@/lib/auth';

export async function GET(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const [products, favorites] = await Promise.all([
      prisma.productList.findMany({
        where: { user_id: user.id },
        orderBy: { id: 'desc' },
        include: { category: true },
      }),
      prisma.favorite.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              category: true,
              user: {
                select: { id: true, name: true, email: true, address: true },
              },
            },
          },
        },
      }),
    ]);

    const productsWithCategory = products.map((p) => ({
      ...p,
      category_name: p.category?.category_name || '',
    }));

    const favoriteProducts = favorites.map((favorite) => ({
      ...favorite.product,
      favoriteId: favorite.id,
      favoriteCreatedAt: favorite.createdAt,
      category_name: favorite.product.category?.category_name || '',
      isFavorited: true,
    }));

    return Response.json({ products: productsWithCategory, favorites: favoriteProducts });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
