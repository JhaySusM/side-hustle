import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const categories = await prisma.category.findMany({ orderBy: { category_name: 'asc' } });
    return Response.json({ categories });
  } catch (error) {
    console.error('Category fetch error:', error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}
