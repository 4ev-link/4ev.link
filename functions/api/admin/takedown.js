export async function onRequestPost({ request, env }) {
    try {
        const { admin_pass, slug } = await request.json();
        if (admin_pass !== env.ADMIN_PASS) return new Response("Unauthorized", { status: 401 });
        if (!slug) return new Response("Missing slug", { status: 400 });

        let dest = await env.KV_EV.get(slug);
        if (!dest) return new Response("Slug not found", { status: 404 });

        if (dest.startsWith('✺')) dest = dest.substring(1);
        if (dest.startsWith('🚫')) return new Response("Link is already seized.");

        await env.KV_EV.put(slug, `🚫${dest}`);
        return new Response(`Seized /${slug}. Redirects to /takedown.`);
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}

