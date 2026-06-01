import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// GET: Get seller by ID with their products
export async function GET(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      return Response.json({ error: 'Invalid seller ID' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, user_type: true },
    });
    if (!user) {
      return Response.json({ error: 'Seller not found' }, { status: 404 });
    }
    const products = await prisma.productList.findMany({
      where: { user_id: id },
      orderBy: { id: 'desc' },
      include: { category: true },
    });
    return Response.json({ seller: user, products });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch seller' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  return Response.json({ message: `Seller ${params.id} updated` });
}
