import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'batjee-secret';
const prisma = new PrismaClient();

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
    return Response.json({ user });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
