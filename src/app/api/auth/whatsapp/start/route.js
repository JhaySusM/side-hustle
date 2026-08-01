import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/phone';
import { issueAndSendPhoneOtp } from '@/lib/otp';
import { generateUniqueReferralCode } from '@/lib/referrals';
import { toSafeUser } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'batjee-secret';

export async function POST(request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body.phone);
    if (!phone) {
      return Response.json(
        { error: 'Please enter a valid phone number, including country code (e.g. +923001234567).' },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      const referralCode = await generateUniqueReferralCode({ name: null, email: null });
      user = await prisma.user.create({
        data: {
          phone,
          password: null,
          user_type: 'user',
          status: 'active',
          referralCode,
        },
      });
    }

    await issueAndSendPhoneOtp(prisma, user);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return new Response(
      JSON.stringify({ user: toSafeUser(user), requiresVerification: true, phone }),
      {
        status: 200,
        headers: {
          'Set-Cookie': `batjee_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return Response.json({ error: 'Failed to send verification code' }, { status: 500 });
  }
}
