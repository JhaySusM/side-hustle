import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();

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
    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    // Set cookie
    return new Response(JSON.stringify({ user }), {
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
