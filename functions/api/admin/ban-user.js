export async function onRequestPost({ request, env }) {
    try {
        const { admin_pass, username, days } = await request.json();
        if (admin_pass !== env.ADMIN_PASS) return new Response("Unauthorized", { status: 401 });
        if (!username || !days) return new Response("Missing fields", { status: 400 });

        const bannedUntil = Date.now() + (parseInt(days) * 24 * 60 * 60 * 1000);
        
        const res = await env.D1_EV.prepare("UPDATE users SET banned_until = ? WHERE username = ?")
            .bind(bannedUntil, username)
            .run();

        if (res.meta.changes === 0) return new Response("User not found", { status: 404 });

        return new Response(`User ${username} banned for ${days} days.`);
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}
