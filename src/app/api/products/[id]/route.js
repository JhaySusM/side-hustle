import { getRequestUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin-auth';
import { normalizeProductCategory } from '@/lib/category-catalog';
import { prisma } from '@/lib/prisma';
import { attachSellerFeatureState } from '@/lib/seller-features';
import { getUserCity } from '@/lib/address';

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const product = await prisma.productList.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
        subcategory: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true,
            addressCity: true,
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
      (await isAdminRequest(request));

    if (!canView) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const normalizedProduct = normalizeProductCategory(attachSellerFeatureState(product));
    if (normalizedProduct.user) {
      const { address, addressCity, ...userWithoutAddress } = normalizedProduct.user;
      normalizedProduct.user = { ...userWithoutAddress, city: getUserCity(product.user) };
    }

    return Response.json({ product: normalizedProduct });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch product' }, { status: 500 });
  }
}