export async function onRequestGet({ request, params, env, next, waitUntil }) {
  if (['abuse', 'admin', 'api', 'dash', 'acceptable-use', 'takedown'].includes(params.slug)) return next();
  try {
    let dest = await env.KV_EV.get(params.slug);
    if (dest?.startsWith('✺')) {
      waitUntil((async () => {
        let ref = 'direct';
        try { ref = new URL(request.headers.get('Referer')).hostname } catch {}
        const stmt = `INSERT INTO analytics (slug, referrer, count) VALUES (?, ?, 1) ON CONFLICT(slug, referrer) DO UPDATE SET count = count + 1;`;
        await env.D1_EV.prepare(stmt).bind(params.slug, ref).run().catch(console.error);
      })());
      dest = dest.substring(1);
    }
    
    const url = dest ? `https://${dest}` : new URL('/', request.url).href;
    return Response.redirect(url, dest ? 301 : 302);
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
