import { isAdminRequest } from '@/lib/admin-auth';
import { adminAdjustPoints } from '@/lib/rewards';

export async function POST(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const userId = Number(body.userId);
    const points = Number(body.points);
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 280) : '';

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    const transaction = await adminAdjustPoints({ userId, points, note: note || undefined });
    return Response.json({ transaction });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    if (error.code === 'INSUFFICIENT_POINTS') {
      return Response.json({ error: 'Adjustment would make balance negative' }, { status: 400 });
    }
    return Response.json({ error: error.message || 'Failed to adjust points' }, { status: 500 });
  }
}
