import { prisma } from '@/lib/prisma';
import { requireRequestUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin-auth';
import { normalizeProductCategory } from '@/lib/category-catalog';
import { getSellerOutstandingFeeSummary } from '@/lib/seller-fee-status';
import { creditReferralConversion } from '@/lib/rewards';

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const products = await prisma.productList.findMany({
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
          },
        },
      },
      orderBy: { upload_date_time: 'desc' },
    });
    return Response.json({ products: products.map(normalizeProductCategory) });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const feeSummary = await getSellerOutstandingFeeSummary(prisma, user.id);

    if (feeSummary.hasOutstandingFees) {
      return Response.json(
        {
          error: 'You must settle your outstanding platform fees before posting a new product.',
          outstandingFeeCount: feeSummary.outstandingFeeCount,
          outstandingFeeAmount: feeSummary.outstandingFeeAmount,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      product_name,
      price,
      description,
      image,
      images,
      category_table_id,
      subcategory_table_id,
      upload_date_time
    } = body;
    if (!product_name || !price || !category_table_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id: Number(category_table_id) },
      include: { subcategories: true },
    });
    if (!category) {
      return Response.json({ error: 'Invalid category selected' }, { status: 400 });
    }

    let resolvedSubcategoryId = null;
    if (category.subcategories.length > 0) {
      const matchedSubcategory = category.subcategories.find(
        (subcategory) => subcategory.id === Number(subcategory_table_id)
      );
      if (!matchedSubcategory) {
        return Response.json({ error: 'Please select a valid subcategory for this category' }, { status: 400 });
      }
      resolvedSubcategoryId = matchedSubcategory.id;
    }

    const product = await prisma.productList.create({
      data: {
        product_name,
        price: Number(price),
        description,
        image,
        images: images ? JSON.stringify(images) : null,
        category_table_id: Number(category_table_id),
        subcategory_table_id: resolvedSubcategoryId,
        user_id: user.id,
        product_status: 'Pending',
        upload_date_time: upload_date_time ? new Date(upload_date_time) : undefined,
      },
    });

    try {
      await creditReferralConversion(user.id);
    } catch (rewardError) {
      console.error('Failed to credit referral conversion', rewardError);
    }

    return Response.json({ product });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
