import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { ensureUserReferralCode } from '@/lib/referrals';
import { toSafeUser } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'batjee-secret';

export async function GET(request) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/batjee_token=([^;]+)/);
    if (!match) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const token = match[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const hydratedUser = await ensureUserReferralCode(user);
    return Response.json({ user: toSafeUser(hydratedUser) });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
