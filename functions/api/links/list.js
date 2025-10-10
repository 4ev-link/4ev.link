export async function onRequestPost({ request, env }) {
    try {
        const { username, pass_hash } = await request.json();
        if (!username || !pass_hash) return new Response("Missing fields", { status: 400 });

        const user = await env.D1_EV.prepare("SELECT pass_hash, custom_slugs FROM users WHERE username = ?").bind(username).first();
        if (user?.pass_hash !== pass_hash) return new Response("Invalid credentials", { status: 401 });

        let slugs = [];
        try {
            const parsed = JSON.parse(user.custom_slugs);
            if (Array.isArray(parsed)) slugs = parsed;
        } catch {}

        return Response.json(slugs);
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}


