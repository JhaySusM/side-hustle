import { prisma } from '@/lib/prisma';

export async function GET(_request, { params }) {
  const { id } = await params;

  try {
    const product = await prisma.productList.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
        user: { select: { id: true, name: true, email: true, address: true } },
      },
    });

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({ product });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch product' }, { status: 500 });
  }
}