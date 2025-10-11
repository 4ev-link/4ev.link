export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const slug = url.searchParams.get('slug');
        if (!slug) return new Response("Missing slug", { status: 400 });

        const { results } = await env.D1_EV.prepare("SELECT referrer, count FROM analytics WHERE slug = ? ORDER BY count DESC")
            .bind(slug).all();

        return Response.json(results || []);
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}
