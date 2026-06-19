import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { generateUniqueReferralCode, normalizeReferralCode } from '@/lib/referrals';

const JWT_SECRET = process.env.JWT_SECRET || 'batjee-secret';

// GET: List users
export async function GET(request) {
  try {
    const users = await prisma.user.findMany();
    return Response.json({ users });
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
        password,
        user_type: 'user',
      },
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return new Response(JSON.stringify({ user }), {
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
