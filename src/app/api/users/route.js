import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
    const { email, name, password } = body;
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password,
        user_type: 'user',
      },
    });
    return Response.json({ user });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}
