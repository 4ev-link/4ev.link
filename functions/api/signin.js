export async function onRequestPost({ request, env }) {
  try {
    const { username, pass_hash } = await request.json();
    if (!username || !pass_hash) return new Response('Missing fields', { status: 400 });
    const user = await env.D1_EV.prepare("SELECT pass_hash FROM users WHERE username = ?").bind(username).first();
    if (user?.pass_hash !== pass_hash) return new Response('Invalid credentials', { status: 401 });
    return Response.json({ success: true, username });
  } catch (e) { return new Response(e.message, { status: 500 }); }
}
