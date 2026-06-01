import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { category_name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return Response.json({ categories });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { category_name } = await request.json();
    if (!category_name?.trim()) {
      return Response.json({ error: 'Category name is required' }, { status: 400 });
    }
    const category = await prisma.category.create({
      data: { category_name: category_name.trim() },
    });
    return Response.json({ category }, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return Response.json({ error: 'Category already exists' }, { status: 409 });
    }
    return Response.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) return Response.json({ error: 'Category ID required' }, { status: 400 });
    await prisma.category.delete({ where: { id: Number(id) } });
    return Response.json({ message: 'Category deleted' });
  } catch (error) {
    if (error.code === 'P2003') {
      return Response.json({ error: 'Cannot delete — category has products' }, { status: 409 });
    }
    return Response.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
