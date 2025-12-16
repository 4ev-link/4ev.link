const ntfy = (env,title,msg,p=2) =>
  env.NTFY_URL
    ? fetch(env.NTFY_URL,{
        method:"POST",
        headers:{
          "Title":`🗑️ ${title}`,
          "Priority":String(p),
          "Content-Type":"text/plain"
        },
        body:msg
      }).catch(()=>{})
    : Promise.resolve();

export async function onRequestPost({ request, env }) {
  try {
    const { "cf-turnstile-response":token, ...body } = await request.json();
    const vR = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ secret:env.TURNSTILE_KEY, response:token })
      }
    );
    if (!(await vR.json()).success)
      return new Response("CAPTCHA verification failed.",{ status:403 });

    const { slug, username, pass_hash } = body;
    if (!slug || !username || !pass_hash)
      return new Response("Missing fields",{ status:400 });

    const user = await env.D1_EV
      .prepare("SELECT pass_hash, custom_slugs, banned_until FROM users WHERE username = ?")
      .bind(username)
      .first();
    if (user?.pass_hash !== pass_hash)
      return new Response("Invalid credentials",{ status:401 });

    if (user.banned_until && user.banned_until > Date.now()) {
      const days = Math.ceil((user.banned_until - Date.now()) / 86400000);
      return new Response(`Account banned for ${days} more days.`, { status: 403 });
    }

    let slugs = [];
    try { slugs = JSON.parse(user.custom_slugs) } catch {}
    if (!Array.isArray(slugs) || !slugs.includes(slug))
      return new Response("Unauthorized",{ status:403 });

    // Check seizure
    const current = await env.KV_EV.get(slug);
    if (current?.startsWith('🚫'))
      return new Response("Link seized. Cannot delete.", { status: 403 });

    const newSlugs = slugs.filter(s => s !== slug);
    await Promise.all([
      env.KV_EV.delete(slug),
      env.D1_EV
        .prepare("UPDATE users SET custom_slugs = ? WHERE username = ?")
        .bind(JSON.stringify(newSlugs),username)
        .run(),
      ntfy(
        env,
        "link-delete",
        `event=delete\nuser=${username}\nslug=${slug}`,
        2
      )
    ]);

    return Response.json({ success:true });
  } catch (e) {
    return new Response(e.message,{ status:500 });
  }
}
