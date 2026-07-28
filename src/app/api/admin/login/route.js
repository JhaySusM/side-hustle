import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/passwords';
import { toSafeUser } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'batjee-secret';

function getAdminTokenFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|; )batjee_admin_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Lets the admin panel restore its session on page load, independent of
// the customer-facing /api/auth/me session.
export async function GET(request) {
  const token = getAdminTokenFromRequest(request);
  if (!token) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || user.user_type !== 'admin' || user.status !== 'active') {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return Response.json({ user: toSafeUser(user) });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (
      !user ||
      user.user_type !== 'admin' ||
      user.status !== 'active' ||
      !(await verifyPassword(password, user.password))
    ) {
      return Response.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    // Deliberately a separate cookie from the customer-facing `batjee_token`
    // session, so logging into the admin panel never overwrites (or gets
    // overwritten by) a regular shopper's session in the same browser.
    return new Response(JSON.stringify({ user: toSafeUser(user) }), {
      status: 200,
      headers: {
        'Set-Cookie': `batjee_admin_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return Response.json({ error: 'Admin login failed' }, { status: 500 });
  }
}
