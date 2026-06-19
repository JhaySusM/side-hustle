import { getRequestUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, product_status } = body;
    if (!id || !product_status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await prisma.productList.findUnique({
      where: { id: Number(id) },
      select: { id: true, user_id: true, product_status: true },
    });

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    if (isAdminRequest(request)) {
      const updated = await prisma.productList.update({
        where: { id: product.id },
        data: { product_status },
      });
      return Response.json({ product: updated });
    }

    const user = await getRequestUser(request);
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (product.user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isAllowedOwnerChange =
      product_status === 'Sold' ||
      (product_status === 'Inactive' && product.product_status !== 'Sold') ||
      (product_status === 'Active' && product.product_status === 'Inactive');

    if (!isAllowedOwnerChange) {
      return Response.json({ error: 'This status change requires admin approval' }, { status: 403 });
    }

    const updated = await prisma.productList.update({
      where: { id: product.id },
      data: { product_status },
    });
    return Response.json({ product: updated });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to update status' }, { status: 500 });
  }
}
