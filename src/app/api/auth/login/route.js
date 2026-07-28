import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { ensureUserReferralCode } from '@/lib/referrals';
import { hashPassword, isHashed, verifyPassword } from '@/lib/passwords';
import { toSafeUser } from '@/lib/auth';
import { issueAndSendOtp } from '@/lib/otp';

const JWT_SECRET = process.env.JWT_SECRET || 'batjee-secret';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Transparently upgrade legacy plaintext passwords to a bcrypt hash.
    if (!isHashed(user.password)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(password) },
      });
    }

    const hydratedUser = await ensureUserReferralCode(user);
    // Create JWT
    const token = jwt.sign({ id: hydratedUser.id, email: hydratedUser.email }, JWT_SECRET, { expiresIn: '7d' });
    const cookieHeader = `batjee_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`;

    if (!hydratedUser.emailVerifiedAt) {
      await issueAndSendOtp(prisma, hydratedUser);

      return new Response(
        JSON.stringify({ user: toSafeUser(hydratedUser), requiresVerification: true }),
        {
          status: 200,
          headers: {
            'Set-Cookie': cookieHeader,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Set cookie
    return new Response(JSON.stringify({ user: toSafeUser(hydratedUser) }), {
      status: 200,
      headers: {
        'Set-Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}
