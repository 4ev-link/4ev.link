const notify = (env, title, message, level = 2) =>
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
    const { "g-recaptcha-response": token, ...body } = await request.json();

    const vR = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${env.RECAPCHA_KEY}&response=${token}`,
      }
    );

    if (!(await vR.json()).success)
      return new Response("CAPTCHA verification failed.", { status: 403 });

    const { username, pass_hash } = body;
    if (!username || !pass_hash)
      return new Response("Missing fields", { status: 400 });

    if (
      await env.D1_EV.prepare(
        "SELECT 1 FROM users WHERE username = ?"
      )
        .bind(username)
        .first()
    )
      return new Response("User already exists", { status: 409 });

    await env.D1_EV.prepare(
      "INSERT INTO users (username, pass_hash) VALUES (?, ?)"
    )
      .bind(username, pass_hash)
      .run();

    env.NTFY_TOPIC &&
      notify(
        env,
        "4ev.link: signup",
        `user=${username}`,
        2
      );

    return Response.json({ success: true, username }, { status: 201 });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
