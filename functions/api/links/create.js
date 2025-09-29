const genSlug = l => [...Array(l)].map(() => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" [Math.random() * 62 | 0]).join("");
const RESERVED = new Set(["api", "dash", "admin", "login", "logout", "signin", "signup", "register", "account", "settings", "profile", "password", "user", "users", "link", "links", "url", "urls", "robots", "sitemap", "favicon", "well-known", "assets", "static", "img", "js", "css", "public"]);

export async function onRequestPost({ request, env }) {
    try {
        const { 'g-recaptcha-response': token, ...body } = await request.json();
        const vR = await fetch("https://www.google.com/recaptcha/api/siteverify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `secret=${env.RECAPCHA_KEY}&response=${token}` });
        if (!(await vR.json()).success) return new Response("CAPTCHA verification failed.", { status: 403 });

        const { destination_url, slug, username, pass_hash } = body;
        if (!destination_url || !username || !pass_hash) return new Response("Missing fields", { status: 400 });

        const user = await env.D1_EV.prepare("SELECT pass_hash, custom_slugs FROM users WHERE username = ?").bind(username).first();
        if (user?.pass_hash !== pass_hash) return new Response("Invalid credentials", { status: 401 });

        let finalSlug = slug;
        if (finalSlug) {
            if (RESERVED.has(finalSlug.toLowerCase()) || !/^[a-zA-Z0-9-]{3,32}$/.test(finalSlug) || await env.KV_EV.get(finalSlug))
                return new Response("Invalid or taken slug", { status: 400 });
        } else {
            do { finalSlug = genSlug(6) } while (await env.KV_EV.get(finalSlug));
        }

        let url = destination_url.startsWith("http") ? destination_url : `https://${destination_url}`;
        try { new URL(url) } catch { return new Response("Invalid destination URL", { status: 400 }) }
        
        const dest_no_proto = url.replace(/^https?:\/\//, "");
        let slugs;
        try { slugs = JSON.parse(user.custom_slugs) } catch {}
        const newSlugs = Array.isArray(slugs) ? slugs : [];
        newSlugs.push(finalSlug);

        await Promise.all([
            env.KV_EV.put(finalSlug, dest_no_proto),
            env.D1_EV.prepare("UPDATE users SET custom_slugs = ? WHERE username = ?").bind(JSON.stringify(newSlugs), username).run()
        ]);

        return Response.json({ slug: finalSlug }, { status: 201 });
    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}
