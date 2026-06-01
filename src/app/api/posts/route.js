// GET: List posts, POST: Create post
export async function GET(request) {
  return Response.json({ posts: [] });
}

export async function POST(request) {
  return Response.json({ message: 'Post created' });
}
