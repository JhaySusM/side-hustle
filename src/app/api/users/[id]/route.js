import { PrismaClient } from '@prisma/client';
import { toSafeUser } from '@/lib/auth';
import { isAdminRequest, getAdminUser } from '@/lib/admin-auth';
import { logActivity } from '@/lib/activity-log';
const prisma = new PrismaClient();

export async function GET(request, { params }) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const userId = Number(id);
  try {
    const [user, listingsCount, transactionsCount, reportsReceivedCount, loginActivity] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.productList.count({ where: { user_id: userId } }),
      prisma.transaction.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }] } }),
      prisma.productReport.count({ where: { sellerId: userId } }),
      prisma.activityLog.findMany({ where: { userId, action: 'login' }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    return Response.json({
      user: toSafeUser(user),
      stats: { listings: listingsCount, transactions: transactionsCount, reportsReceived: reportsReceivedCount },
      loginActivity,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { status } = body;
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { status },
    });

    await logActivity(prisma, {
      userId: user.id,
      actorId: admin.id,
      actorType: 'admin',
      action: status === 'active' ? 'user_reinstated' : 'user_suspended',
      category: 'account',
      status: 'admin',
      detail: `${admin.name || admin.email} ${status === 'active' ? 'reinstated' : 'suspended'} ${user.name || user.email}`,
      request,
    });

    return Response.json({ user: toSafeUser(user) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    return Response.json({ message: 'User deleted' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
