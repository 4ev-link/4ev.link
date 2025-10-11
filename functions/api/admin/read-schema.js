export async function onRequestPost({ request, env }) {
    try {
        const { admin_pass } = await request.json();
        if (admin_pass !== env.ADMIN_PASS) return new Response("Unauthorized", { status: 401 });

        const { results } = await env.D1_EV.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").all();
        const schema = results.length ? results[0].sql : "Table 'users' not found.";

        return new Response(schema);
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}
