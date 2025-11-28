export async function onRequestPost({ request, env }) {
    try {
        const { admin_pass } = await request.json();
        if (admin_pass !== env.ADMIN_PASS) return new Response("Unauthorized", { status: 401 });

        const schema = `CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, pass_hash TEXT, custom_slugs TEXT);`;
        await env.D1_EV.exec(schema);

        return new Response("Users table (v1) created successfully.");
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}
