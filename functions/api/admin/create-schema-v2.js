export async function onRequestPost({ request, env }) {
    try {
        const { admin_pass } = await request.json();
        if (admin_pass !== env.ADMIN_PASS) return new Response("Unauthorized", { status: 401 });

        const schema = `
          CREATE TABLE IF NOT EXISTS analytics (
            slug TEXT,
            referrer TEXT,
            count INTEGER DEFAULT 1,
            PRIMARY KEY (slug, referrer)
          );
        `;
        await env.D1_EV.exec(schema);

        return new Response("Schema v2 (analytics) created successfully.");
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}
