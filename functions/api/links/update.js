const notify = (env, title, message, level = 1) =>
  env.NTFY_TOPIC
    ? fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          Title: title,
          Priority: String(level),
        },
        body: message,
      }).catch(() => {})
    : Promise.resolve();

export async function onRequestPost({ request, env }) {
  try {
    const { "cf-turnstile-response": token, ...body } = await request.json();

    const vR = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: env.TURNSTILE_KEY,
          response: token,
        }),
      }
    );

    if (!(await vR.json()).success)
      return new Response("CAPTCHA verification failed.", { status: 403 });

    const {
      slug,
      destination_url,
      analytics_enabled,
      username,
      pass_hash,
    } = body;

    if (!slug || !destination_url || !username || !pass_hash)
      return new Response("Missing fields", { status: 400 });

    const user = await env.D1_EV.prepare(
      "SELECT pass_hash, custom_slugs FROM users WHERE username = ?"
    )
      .bind(username)
      .first();

    if (user?.pass_hash !== pass_hash)
      return new Response("Invalid credentials", { status: 401 });

    let slugs = [];
    try {
      slugs = JSON.parse(user.custom_slugs);
    } catch {}

    if (!Array.isArray(slugs) || !slugs.includes(slug))
      return new Response("Unauthorized", { status: 403 });

    let url = destination_url.startsWith("http")
      ? destination_url
      : `https://${destination_url}`;

    try {
      new URL(url);
    } catch {
      return new Response("Invalid destination URL", { status: 400 });
    }

    const dest_no_proto = url.replace(/^https?:\/\//, "");
    const kvValue = analytics_enabled ? `✺${dest_no_proto}` : dest_no_proto;

    await env.KV_EV.put(slug, kvValue);

    env.NTFY_TOPIC &&
      notify(
        env,
        "4ev.link: link updated",
        `user=${username} slug=${slug} dest=${dest_no_proto} analytics=${!!analytics_enabled}`,
        1
      );

    return Response.json({ success: true });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
