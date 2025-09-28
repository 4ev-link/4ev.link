# 4ev.link

A simple, permanent URL shortener built on Cloudflare Workers, D1, and KV.

## Features

- Custom slugs & user accounts.
- Fast redirects using Cloudflare's edge network.
- Secure with reCAPTCHA.

## Deployment

1.  Clone this repository.
2.  Configure secrets in your Cloudflare dashboard:
    -   `RECAPCHA_KEY`: Your Google reCAPTCHA v2 secret key.
    -   Bind a D1 database as `D1_EV`.
    -   Bind a KV namespace as `KV_EV`.
3.  Deploy with `wrangler deploy`.
