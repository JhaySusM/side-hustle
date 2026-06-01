import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'batjee-secret';

export async function GET(request) {
  try {
    // Get JWT from cookies
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/batjee_token=([^;]+)/);
    if (!match) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = match[1];
    let user;
    try {
      user = jwt.verify(token, JWT_SECRET);
    } catch {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }
    // Fetch products for this user
    const products = await prisma.productList.findMany({
      where: { user_id: user.id },
      orderBy: { id: 'desc' },
      include: { category: true },
    });
    // Attach category_name at top level for convenience
    const productsWithCategory = products.map((p) => ({
      ...p,
      category_name: p.category?.category_name || '',
    }));
    return Response.json({ products: productsWithCategory });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
