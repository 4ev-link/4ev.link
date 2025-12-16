const genSlug = l => [...Array(l)]
  .map(()=>"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.random()*62|0])
  .join("");
const RESERVED = new Set([
  "api","dash","admin","login","logout","signin","signup","register","account",
  "settings","profile","password","user","users","link","links","url","urls",
  "robots","sitemap","favicon","well-known","assets","static","img","js","css","public"
]);
const ntfy = (env,title,msg,slug,user,p=3) => {
  if(!env.NTFY_URL) return Promise.resolve();
  const origin = "https://4ev.link";
  const actions = `view, Seize, ${origin}/admin?slug=${slug}; view, Ban User, ${origin}/admin?user=${user}`;
  return fetch(env.NTFY_URL,{
    method:"POST",
    headers:{
      "Title":`🔔 ${title}`,
      "Priority":String(p),
      "Content-Type":"text/plain",
      "Actions": actions
    },
    body:msg
  }).catch(()=>{});
};

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

    const { destination_url, slug, username, pass_hash } = body;
    if (!destination_url || !username || !pass_hash)
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

    let finalSlug = slug;
    if (finalSlug) {
      if (
        RESERVED.has(finalSlug.toLowerCase()) ||
        !/^[a-zA-Z0-9-]{3,32}$/.test(finalSlug) ||
        await env.KV_EV.get(finalSlug)
      ) return new Response("Invalid or taken slug",{ status:400 });
    } else {
      do { finalSlug = genSlug(6) }
      while (await env.KV_EV.get(finalSlug));
    }

    let url = destination_url.startsWith("http")
      ? destination_url
      : `https://${destination_url}`;
    try { new URL(url) }
    catch { return new Response("Invalid destination URL",{ status:400 }) }

    const dest_no_proto = url.replace(/^https?:\/\//,"");
    let slugs;
    try { slugs = JSON.parse(user.custom_slugs) } catch {}
    const newSlugs = Array.isArray(slugs) ? slugs : [];
    newSlugs.push(finalSlug);

    await Promise.all([
      env.KV_EV.put(finalSlug,dest_no_proto),
      env.D1_EV
        .prepare("UPDATE users SET custom_slugs = ? WHERE username = ?")
        .bind(JSON.stringify(newSlugs),username)
        .run(),
      ntfy(
        env,
        "link-create",
        `event=create\nuser=${username}\nslug=${finalSlug}\ndestination=${dest_no_proto}`,
        finalSlug,
        username,
        3
      )
    ]);

    return Response.json({ slug:finalSlug },{ status:201 });
  } catch (e) {
    return new Response(e.message,{ status:500 });
  }
}
