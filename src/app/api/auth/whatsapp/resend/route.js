import { prisma } from '@/lib/prisma';
import { getRequestUser, toSafeUser } from '@/lib/auth';
import { issueAndSendPhoneOtp } from '@/lib/otp';

export async function POST(request) {
  try {
    const sessionUser = await getRequestUser(request);
    if (!sessionUser) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!user || !user.phone) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.phoneVerifiedAt) {
      return Response.json({ error: 'Already verified' }, { status: 400 });
    }

    await issueAndSendPhoneOtp(prisma, user);

    return Response.json({ user: toSafeUser(user), requiresVerification: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to resend code' }, { status: 500 });
  }
}
