import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

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
    const { email, name, address, password } = body;
    const trimmedAddress = address?.trim();

    if (!email || !password || !trimmedAddress) {
      return Response.json({ error: 'Email, password, and address are required' }, { status: 400 });
    }
    const user = await prisma.user.create({
      data: {
        email,
        name,
        address: trimmedAddress,
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
    return Response.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}
