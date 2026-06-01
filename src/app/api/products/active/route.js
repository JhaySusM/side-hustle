import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '5', 10);
    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      prisma.productList.findMany({
        where: { product_status: 'Active' },
        orderBy: { id: 'desc' },
        include: { category: true, user: true },
        skip,
        take: pageSize,
      }),
      prisma.productList.count({ where: { product_status: 'Active' } }),
    ]);
    return Response.json({ products, total });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}
