import { prisma } from '@/lib/prisma';
import { getRequestUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const viewer = await getRequestUser(request);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(60, Math.max(1, parseInt(searchParams.get('pageSize') || '5', 10)));
    const query = (searchParams.get('q') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const location = (searchParams.get('location') || '').trim();
    const skip = (page - 1) * pageSize;

    const where = {
      product_status: 'Active',
      ...(query
        ? {
            OR: [
              { product_name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(category
        ? {
            category: {
              category_name: { equals: category, mode: 'insensitive' },
            },
          }
        : {}),
      ...(location
        ? {
            user: {
              address: { contains: location, mode: 'insensitive' },
            },
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      prisma.productList.findMany({
        where,
        orderBy: { id: 'desc' },
        include: {
          category: true,
          user: { select: { id: true, name: true, email: true, address: true } },
          ...(viewer
            ? {
                favorites: {
                  where: { userId: viewer.id },
                  select: { id: true },
                },
              }
            : {}),
        },
        skip,
        take: pageSize,
      }),
      prisma.productList.count({ where }),
    ]);

    const productsWithFavoriteState = products.map((product) => ({
      ...product,
      isFavorited: viewer ? product.favorites.length > 0 : false,
    }));

    return Response.json({
      products: productsWithFavoriteState,
      total,
      page,
      pageSize,
      hasMore: skip + productsWithFavoriteState.length < total,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}
