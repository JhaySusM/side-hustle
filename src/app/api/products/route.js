import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.productList.findMany({
      include: { category: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { upload_date_time: 'desc' },
    });
    return Response.json({ products });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      product_name,
      price,
      description,
      image,
      images,
      category_table_id,
      user_id,
      upload_date_time
    } = body;
    if (!product_name || !price || !category_table_id || !user_id) {
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
        user_id: Number(user_id),
        product_status: 'Active',
        upload_date_time: upload_date_time ? new Date(upload_date_time) : undefined,
      },
    });
    return Response.json({ product });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
