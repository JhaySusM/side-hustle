import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { generateUniqueReferralCode, normalizeReferralCode } from '@/lib/referrals';
import { toSafeUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin-auth';
import { hashPassword } from '@/lib/passwords';
import { generateOtp, hashOtp, OTP_EXPIRY_MS } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';
import { logActivity } from '@/lib/activity-log';

const JWT_SECRET = process.env.JWT_SECRET || 'batjee-secret';

// GET: List users (admin only — returns account data for every user)
export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany();
    return Response.json({ users: users.map(toSafeUser) });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Create user
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      address,
      password,
      addressHouseNo,
      addressStreetNo,
      addressArea,
      addressCity,
      addressPostalCode,
      addressCountry,
      referralCode,
    } = body;

    const houseNo = addressHouseNo?.trim() || '';
    const streetNo = addressStreetNo?.trim() || '';
    const area = addressArea?.trim() || '';
    const city = addressCity?.trim() || '';
    const postalCode = addressPostalCode?.trim() || '';
    const country = addressCountry?.trim() || '';
    const trimmedAddress = address?.trim() || '';

    const hasStructuredAddress = houseNo || streetNo || area || city || postalCode || country;

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedReferralCode = normalizeReferralCode(referralCode);

    if (!normalizedEmail || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (!trimmedAddress && !hasStructuredAddress) {
      return Response.json({ error: 'Address is required' }, { status: 400 });
    }

    if (hasStructuredAddress && (!houseNo || !streetNo || !area || !city || !postalCode || !country)) {
      return Response.json(
        { error: 'Please complete all address fields (house, street, area, city, postal code, country)' },
        { status: 400 }
      );
    }

    const normalizedAddress = hasStructuredAddress
      ? [
          `House No. ${houseNo}, Street No. ${streetNo}`,
          area,
          `${city} - ${postalCode}`,
          country,
        ].join(', ')
      : trimmedAddress;

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return Response.json({ error: 'Email is already registered. Please sign in instead.' }, { status: 409 });
    }

    let referrer = null;

    if (normalizedReferralCode) {
      referrer = await prisma.user.findUnique({
        where: { referralCode: normalizedReferralCode },
        select: { id: true },
      });

      if (!referrer) {
        return Response.json({ error: 'Referral code is invalid.' }, { status: 400 });
      }
    }

    const generatedReferralCode = await generateUniqueReferralCode({
      name,
      email: normalizedEmail,
    });

    const otp = generateOtp();

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        address: normalizedAddress,
        addressHouseNo: hasStructuredAddress ? houseNo : null,
        addressStreetNo: hasStructuredAddress ? streetNo : null,
        addressArea: hasStructuredAddress ? area : null,
        addressCity: hasStructuredAddress ? city : null,
        addressPostalCode: hasStructuredAddress ? postalCode : null,
        addressCountry: hasStructuredAddress ? country : null,
        referralCode: generatedReferralCode,
        referredById: referrer?.id || null,
        password: await hashPassword(password),
        user_type: 'user',
        emailVerificationCodeHash: await hashOtp(otp),
        emailVerificationExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        emailVerificationAttempts: 0,
      },
    });

    try {
      await sendOtpEmail(user.email, otp);
    } catch (emailError) {
      try {
        await prisma.user.delete({ where: { id: user.id } });
      } catch {
        // Rollback failing isn't fatal — the account can still recover via
        // the login flow, which also resends a fresh OTP.
      }
      return Response.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    await logActivity(prisma, {
      userId: user.id,
      action: 'account_created',
      category: 'account',
      status: 'success',
      detail: `Account created for ${user.email}`,
      request,
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return new Response(JSON.stringify({ user: toSafeUser(user), requiresVerification: true }), {
      status: 200,
      headers: {
        'Set-Cookie': `batjee_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      return Response.json({ error: 'Email is already registered. Please sign in instead.' }, { status: 409 });
    }

    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
