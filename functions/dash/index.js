export async function onRequestGet({ request, env }) {
  try {
    // Fetch the static dash/index.html file
    const response = await env.ASSETS.fetch(request);
    const html = await response.text();
    
    // Inject the reCAPTCHA site key from environment
    const siteKey = env.RECAPTCHA_SITE_KEY || 'ENV_VAR_NOT_SET';
    
    const modifiedHtml = html.replace(
      '__RECAPTCHA_SITE_KEY__',
      siteKey
    );

    return new Response(modifiedHtml, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  } catch (error) {
    console.error('[Dash] Error:', error.message);
    return new Response('Error loading page', { status: 500 });
  }
}
