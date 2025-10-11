export async function onRequestGet({ request, params, env, next }) {
  if (['abuse', 'admin', 'api', 'dash', 'acceptable-use'].includes(params.slug)) return next();
  try {
    const dest = await env.KV_EV.get(params.slug);
    const url = dest ? `https://${dest}` : new URL('/', request.url).href;
    return Response.redirect(url, dest ? 301 : 302);
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
