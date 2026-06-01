// GET: Get user by id, PUT: Update user, DELETE: Remove user
export async function GET(request, { params }) {
  return Response.json({ user: { id: params.id } });
}

export async function PUT(request, { params }) {
  return Response.json({ message: `User ${params.id} updated` });
}

export async function DELETE(request, { params }) {
  return Response.json({ message: `User ${params.id} deleted` });
}
