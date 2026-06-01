// GET: Get post by id, PUT: Update post, DELETE: Remove post
export async function GET(request, { params }) {
  return Response.json({ post: { id: params.id } });
}

export async function PUT(request, { params }) {
  return Response.json({ message: `Post ${params.id} updated` });
}

export async function DELETE(request, { params }) {
  return Response.json({ message: `Post ${params.id} deleted` });
}
