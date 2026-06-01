// /api/auth/logout/route.js
export async function POST() {
  // Set the cookie to expire immediately
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Set-Cookie': 'batjee_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict',
      'Content-Type': 'application/json',
    },
  });
}
