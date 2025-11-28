const ntfy = (env,title,msg,slug,user,p=2) => {
  if(!env.NTFY_TOPIC) return Promise.resolve();
  const origin = "https://4ev.link";
  const actions = `view, Seize, ${origin}/admin?slug=${slug}; view, Ban User, ${origin}/admin?user=${user}`;
  return fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`,{
        method:"POST",
        headers:{
          "Title":`✏️ ${title}`,
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

    const {
      slug,
      destination_url,
      analytics_enabled,
      username,
      pass_hash
    } = body;
    if (!slug || !destination_url || !username || !pass_hash)
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

    // Check if seized
    const current = await env.KV_EV.get(slug);
    if (current?.startsWith('🚫'))
      return new Response("This link has been seized and cannot be updated.", { status: 403 });

    let url = destination_url.startsWith("http")
      ? destination_url
      : `https://${destination_url}`;
    try { new URL(url) }
    catch { return new Response("Invalid destination URL",{ status:400 }) }

    const dest_no_proto = url.replace(/^https?:\/\//,"");
    const kvValue = analytics_enabled ? `✺${dest_no_proto}` : dest_no_proto;
    const evt = analytics_enabled ? "analytics-on" : "update";

    await Promise.all([
      env.KV_EV.put(slug,kvValue),
      ntfy(
        env,
        `link-${evt}`,
        `event=${evt}\nuser=${username}\nslug=${slug}\ndestination=${dest_no_proto}\nanalytics_enabled=${!!analytics_enabled}`,
        slug,
        username,
        2
      )
    ]);

    return Response.json({ success:true });
  } catch (e) {
    return new Response(e.message,{ status:500 });
  }
}
