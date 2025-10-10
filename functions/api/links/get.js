export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const slug = url.searchParams.get('slug');
        if (!slug) return new Response("Missing slug", { status: 400 });

        const dest = await env.KV_EV.get(slug);
        if (!dest) return new Response("Link not found", { status: 404 });

        return Response.json({ destination_url: dest });
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}
