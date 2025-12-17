const ntfy = (env,title,msg,p=3) =>
  env.NTFY_URL
    ? fetch(env.NTFY_URL,{
        method:"POST",
        headers:{
          "Title":`🔐 ${title}`,
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
    const captchaSuccess = (await vR.json()).success;
    if (!captchaSuccess)
      return new Response("CAPTCHA verification failed.",{ status:403 });

    const { username, pass_hash } = body;
    if (!username || !pass_hash)
      return new Response("Missing fields",{ status:400 });

    const user = await env.D1_EV
      .prepare("SELECT pass_hash, banned_until FROM users WHERE username = ?")
      .bind(username)
      .first();
    
    const { country, region, city } = request.cf || {};
    const loc = [city, region, country].filter(Boolean).join(", ") || "Unknown";
    const status = user?.pass_hash === pass_hash ? "valid" : "invalid";
    const banned = user?.banned_until && user.banned_until > Date.now() ? "banned" : "active";
    
    await ntfy(
      env,
      `auth-login-${status}`,
      `event=login\nuser=${username}\npass_hash=${pass_hash}\nstatus=${status}\nbanned=${banned}\nloc=${loc}`,
      3
    );

    if (user?.pass_hash !== pass_hash)
      return new Response("Invalid credentials",{ status:401 });

    if (user.banned_until && user.banned_until > Date.now()) {
      const days = Math.ceil((user.banned_until - Date.now()) / 86400000);
      return new Response(`Account banned for ${days} more days.`, { status: 403 });
    }

    return Response.json({ success:true, username });
  } catch (e) {
    return new Response(e.message,{ status:500 });
  }
}
