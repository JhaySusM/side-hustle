import { prisma } from '@/lib/prisma';
import { getRequestUser, toSafeUser } from '@/lib/auth';
import { verifyOtp, MAX_OTP_ATTEMPTS } from '@/lib/otp';

export async function POST(request) {
  try {
    const sessionUser = await getRequestUser(request);
    if (!sessionUser) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const code = String(body.code || '').trim();
    if (!code) {
      return Response.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.emailVerifiedAt) {
      return Response.json({ user: toSafeUser(user) });
    }

    if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
      return Response.json({ error: 'No verification code pending. Please request a new one.' }, { status: 400 });
    }

    if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
      return Response.json({ error: 'Code expired, request a new one.' }, { status: 400 });
    }

    if (user.emailVerificationAttempts >= MAX_OTP_ATTEMPTS) {
      return Response.json({ error: 'Too many attempts, request a new code.' }, { status: 429 });
    }

    const matches = await verifyOtp(code, user.emailVerificationCodeHash);
    if (!matches) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationAttempts: { increment: 1 } },
      });
      return Response.json({ error: 'Invalid code' }, { status: 400 });
    }

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
        emailVerificationAttempts: 0,
      },
    });

    return Response.json({ user: toSafeUser(verifiedUser) });
  } catch (error) {
    return Response.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
