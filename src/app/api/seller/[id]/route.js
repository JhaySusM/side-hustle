import { getRequestUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin-auth';
import { normalizeProductCategory } from '@/lib/category-catalog';
import { prisma } from '@/lib/prisma';
import { attachSellerFeatureState, serializeSellerFeatures } from '@/lib/seller-features';
import { attachProductPromotionState } from '@/lib/rewards';
import { getUserCity } from '@/lib/address';

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
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        addressCity: true,
        user_type: true,
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
        badge: true,
      },
    });
    if (!user) {
      return Response.json({ error: 'Seller not found' }, { status: 404 });
    }

    const viewer = await getRequestUser(request);
    const canViewAllProducts = viewer?.id === id || (await isAdminRequest(request));
    const products = await prisma.productList.findMany({
      where: {
        user_id: id,
        ...(canViewAllProducts
          ? {}
          : {
              product_status: {
                in: ['Active', 'Sold'],
              },
            }),
      },
      orderBy: { id: 'desc' },
      include: {
        category: true,
        promotions: {
          where: { endsAt: { gt: new Date() } },
        },
        user: prisma.sellerFeature
          ? {
              select: {
                id: true,
                sellerFeatures: {
                  where: {
                    endsAt: { gt: new Date() },
                  },
                  orderBy: { endsAt: 'desc' },
                },
              },
            }
          : { select: { id: true } },
      },
    });
    const { address, addressCity, badge, ...userWithoutAddress } = user;

    return Response.json({
      seller: {
        ...userWithoutAddress,
        city: getUserCity(user),
        sellerFeatures: serializeSellerFeatures(user.sellerFeatures || []),
        isFeaturedSeller: (user.sellerFeatures || []).length > 0,
        hasReferrerBadge: Boolean(badge),
      },
      products: products.map((product) =>
        normalizeProductCategory(attachProductPromotionState(attachSellerFeatureState(product)))
      ),
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch seller' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  return Response.json({ message: `Seller ${params.id} updated` });
}
