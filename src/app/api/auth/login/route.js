import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { ensureUserReferralCode } from '@/lib/referrals';

const JWT_SECRET = process.env.JWT_SECRET || 'batjee-secret';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    const hydratedUser = await ensureUserReferralCode(user);
    // Create JWT
    const token = jwt.sign({ id: hydratedUser.id, email: hydratedUser.email }, JWT_SECRET, { expiresIn: '7d' });
    // Set cookie
    return new Response(JSON.stringify({ user: hydratedUser }), {
      status: 200,
      headers: {
        'Set-Cookie': `batjee_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}
