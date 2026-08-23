import { prisma } from '@/lib/prisma';
import { getRequestUser } from '@/lib/auth';
import { getCategoryFilterNames, normalizeProductCategory } from '@/lib/category-catalog';
import { getUserCity } from '@/lib/address';
import {
  attachSellerFeatureState,
  normalizeFeaturePlacement,
  FEATURE_PLACEMENTS,
} from '@/lib/seller-features';
import {
  attachProductPromotionState,
  attachUserBadgeState,
  PROMOTION_TYPES,
} from '@/lib/rewards';

export async function GET(request) {
  try {
    const viewer = await getRequestUser(request);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(60, Math.max(1, parseInt(searchParams.get('pageSize') || '5', 10)));
    const query = (searchParams.get('q') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const subcategory = (searchParams.get('subcategory') || '').trim();
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
              category_name: {
                in: getCategoryFilterNames(category),
              },
            },
          }
        : {}),
      ...(subcategory
        ? {
            subcategory: {
              subcategory_name: subcategory,
            },
          }
        : {}),
      ...(location
        ? {
            user: {
              OR: [
                { addressCity: { contains: location, mode: 'insensitive' } },
                { address: { contains: location, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const preferredPlacement = query
      ? FEATURE_PLACEMENTS.SEARCH_BOOST
      : category
      ? FEATURE_PLACEMENTS.CATEGORY_TOP
      : FEATURE_PLACEMENTS.HOMEPAGE_BANNER;

    const now = new Date();

    // Boost/feature ranking isn't a plain SQL column, so we can't ORDER BY it
    // directly. Rather than hydrating every active listing (category,
    // subcategory, full seller profile, promotions...) just to sort and throw
    // most of it away, do a cheap pass with only the fields the ranking needs,
    // figure out which `pageSize` ids belong on this page, then hydrate only
    // those.
    const [rankRows, total] = await Promise.all([
      prisma.productList.findMany({
        where,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          promotions: {
            where: { endsAt: { gt: now } },
            select: { promotionType: true },
          },
          user: {
            select: {
              sellerFeatures: {
                where: { endsAt: { gt: now } },
                select: { placement: true },
              },
            },
          },
        },
      }),
      prisma.productList.count({ where }),
    ]);

    function rankOf(row) {
      const isPremium = row.promotions.some((p) => p.promotionType === PROMOTION_TYPES.PREMIUM_SLOT);
      const isBoosted = row.promotions.some((p) => p.promotionType === PROMOTION_TYPES.BOOST);
      const placements = new Set(
        (row.user?.sellerFeatures || [])
          .map((f) => normalizeFeaturePlacement(f.placement))
          .filter(Boolean)
      );
      const isPreferred = Boolean(preferredPlacement) && placements.has(preferredPlacement);
      const isFeatured = placements.size > 0;
      return [isPremium ? 1 : 0, isBoosted ? 1 : 0, isPreferred ? 1 : 0, isFeatured ? 1 : 0];
    }

    const sortedIds = rankRows
      .map((row) => ({ id: row.id, rank: rankOf(row) }))
      .sort((left, right) => {
        for (let i = 0; i < left.rank.length; i++) {
          if (left.rank[i] !== right.rank[i]) {
            return right.rank[i] - left.rank[i];
          }
        }
        return right.id - left.id;
      })
      .map((row) => row.id);

    const pagedIds = sortedIds.slice(skip, skip + pageSize);

    const hydratedProducts = pagedIds.length
      ? await prisma.productList.findMany({
          where: { id: { in: pagedIds } },
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
                createdAt: true,
                sellerRatingAvg: true,
                sellerRatingCount: true,
                sellerFeatures: {
                  where: { endsAt: { gt: now } },
                  orderBy: { endsAt: 'desc' },
                },
                badge: true,
              },
            },
            promotions: {
              where: { endsAt: { gt: now } },
            },
            ...(viewer
              ? {
                  favorites: {
                    where: { userId: viewer.id },
                    select: { id: true },
                  },
                }
              : {}),
          },
        })
      : [];

    const hydratedById = new Map(hydratedProducts.map((product) => [product.id, product]));
    const pagedProducts = pagedIds
      .map((id) => hydratedById.get(id))
      .filter(Boolean)
      .map(attachSellerFeatureState)
      .map((product) => attachProductPromotionState({ ...product, user: attachUserBadgeState(product.user) }));

    const productsWithFavoriteState = pagedProducts.map((product) => {
      const { address, addressCity, badge, ...userWithoutAddress } = product.user || {};
      return {
        ...normalizeProductCategory(product),
        user: product.user ? { ...userWithoutAddress, city: getUserCity(product.user) } : product.user,
        isFavorited: viewer ? product.favorites.length > 0 : false,
      };
    });

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
