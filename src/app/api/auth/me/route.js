import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { ensureUserReferralCode } from '@/lib/referrals';
import { toSafeUser, requireRequestUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

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

export async function PATCH(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const {
      addressHouseNo,
      addressStreetNo,
      addressArea,
      addressCity,
      addressPostalCode,
      addressCountry,
    } = body;

    if (
      !addressHouseNo?.trim() ||
      !addressStreetNo?.trim() ||
      !addressArea?.trim() ||
      !addressCity?.trim() ||
      !addressPostalCode?.trim() ||
      !addressCountry?.trim()
    ) {
      return Response.json({ error: 'Please fill in all address fields.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        addressHouseNo: addressHouseNo.trim(),
        addressStreetNo: addressStreetNo.trim(),
        addressArea: addressArea.trim(),
        addressCity: addressCity.trim(),
        addressPostalCode: addressPostalCode.trim(),
        addressCountry: addressCountry.trim(),
      },
    });

    await logActivity(prisma, {
      userId: user.id,
      action: 'profile_updated',
      category: 'account',
      status: 'success',
      detail: 'Address updated',
      request,
    });

    return Response.json({ user: toSafeUser(updated) });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to update address' }, { status: 500 });
  }
}
