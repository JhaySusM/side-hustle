import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(60, Math.max(1, parseInt(searchParams.get('pageSize') || '5', 10)));
    const query = (searchParams.get('q') || '').trim();
    const category = (searchParams.get('category') || '').trim();
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
    };

    const [products, total] = await Promise.all([
      prisma.productList.findMany({
        where,
        orderBy: { id: 'desc' },
        include: {
          category: true,
          user: { select: { id: true, name: true, email: true, address: true } },
        },
        skip,
        take: pageSize,
      }),
      prisma.productList.count({ where }),
    ]);

    return Response.json({
      products,
      total,
      page,
      pageSize,
      hasMore: skip + products.length < total,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}
