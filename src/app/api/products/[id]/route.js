import { getRequestUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin-auth';
import { normalizeProductCategory } from '@/lib/category-catalog';
import { prisma } from '@/lib/prisma';
import { attachSellerFeatureState } from '@/lib/seller-features';

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const product = await prisma.productList.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true,
            sellerRatingAvg: true,
            sellerRatingCount: true,
            sellerFeatures: prisma.sellerFeature
              ? {
                  where: {
                    endsAt: { gt: new Date() },
                  },
                  orderBy: { endsAt: 'desc' },
                }
              : false,
          },
        },
      },
    });

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const viewer = await getRequestUser(request);
    const canView =
      product.product_status === 'Active' ||
      product.product_status === 'Sold' ||
      product.user_id === viewer?.id ||
      isAdminRequest(request);

    if (!canView) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({ product: normalizeProductCategory(attachSellerFeatureState(product)) });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch product' }, { status: 500 });
  }
}