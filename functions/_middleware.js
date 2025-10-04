// Middleware to inject environment variables into HTML responses
export async function onRequest({ request, next, env }) {
  const response = await next();
  
  // Only process HTML responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }

  // Get the HTML content
  const html = await response.text();
  
  // Inject the reCAPTCHA site key from environment
  const siteKey = env.RECAPTCHA_SITE_KEY || 'ENV_VAR_NOT_SET';
  
  const modifiedHtml = html.replace(
    '__RECAPTCHA_SITE_KEY__',
    siteKey
  );

  // Return modified response
  return new Response(modifiedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}
