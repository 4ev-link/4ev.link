export async function onRequestPost({ request, env }) {
    try {
        const { 'g-recaptcha-response': token, ...body } = await request.json();
        const vR = await fetch("https://www.google.com/recaptcha/api/siteverify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `secret=${env.RECAPCHA_KEY}&response=${token}` });
        if (!(await vR.json()).success) return new Response("CAPTCHA verification failed.", { status: 403 });

        const { slug, destination_url, username, pass_hash } = body;
        if (!slug || !destination_url || !username || !pass_hash) return new Response("Missing fields", { status: 400 });

        const user = await env.D1_EV.prepare("SELECT pass_hash, custom_slugs FROM users WHERE username = ?").bind(username).first();
        if (user?.pass_hash !== pass_hash) return new Response("Invalid credentials", { status: 401 });

        let slugs = [];
        try { slugs = JSON.parse(user.custom_slugs) } catch {}
        if (!Array.isArray(slugs) || !slugs.includes(slug)) return new Response("Permission denied to edit this slug.", { status: 403 });
        
        let url = destination_url.startsWith("http") ? destination_url : `https://${destination_url}`;
        try { new URL(url) } catch { return new Response("Invalid destination URL", { status: 400 }) }

        const dest_no_proto = url.replace(/^https?:\/\//, "");
        await env.KV_EV.put(slug, dest_no_proto);

        return Response.json({ success: true, slug, destination: dest_no_proto });
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}
