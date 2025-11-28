export async function onRequestPost({ request, env }) {
    try {
        const { admin_pass } = await request.json();
        if (admin_pass !== env.ADMIN_PASS) return new Response("Unauthorized", { status: 401 });

        // Add banned_until column (INTEGER for timestamp)
        try {
            await env.D1_EV.exec(`ALTER TABLE users ADD COLUMN banned_until INTEGER;`);
            return new Response("Migration v2 (users) successful: Added banned_until.");
        } catch (e) {
            if (e.message.includes("duplicate column")) {
                return new Response("Migration already applied.");
            }
            throw e;
        }
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}
