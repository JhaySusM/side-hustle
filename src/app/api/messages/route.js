// GET: List messages, POST: Create message
export async function GET(request) {
  return Response.json({ messages: [] });
}

export async function POST(request) {
  return Response.json({ message: 'Message created' });
}
