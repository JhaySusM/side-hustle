import { prisma } from '@/lib/prisma';
import { requireRequestUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin-auth';
import { normalizeProductCategory } from '@/lib/category-catalog';
import { getSellerOutstandingFeeSummary } from '@/lib/seller-fee-status';

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const products = await prisma.productList.findMany({
      include: { category: true, user: { select: { id: true, name: true, email: true } } },
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
      upload_date_time
    } = body;
    if (!product_name || !price || !category_table_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const product = await prisma.productList.create({
      data: {
        product_name,
        price: Number(price),
        description,
        image,
        images: images ? JSON.stringify(images) : null,
        category_table_id: Number(category_table_id),
        user_id: user.id,
        product_status: 'Pending',
        upload_date_time: upload_date_time ? new Date(upload_date_time) : undefined,
      },
    });
    return Response.json({ product });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
