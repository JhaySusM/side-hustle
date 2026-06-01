import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    return Response.json({ user });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status } = body;
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { status },
    });
    return Response.json({ user });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    return Response.json({ message: 'User deleted' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
