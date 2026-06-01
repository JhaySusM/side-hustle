import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, product_status } = body;
    if (!id || !product_status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const updated = await prisma.productList.update({
      where: { id: Number(id) },
      data: { product_status },
    });
    return Response.json({ product: updated });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to update status' }, { status: 500 });
  }
}
