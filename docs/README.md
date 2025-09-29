# 4ev.link

A minimalist, permanent URL shortener that runs entirely on Cloudflare's edge network.  
No servers to maintain, no cron jobs, no expiration dates.

![](/docs/ss1.png)

## What it does

- Turns long URLs into short, memorable aliases such as 4ev.link/github  
- Lets every account reserve custom slugs  
- Serves redirects from Cloudflare's global edge—usually under 50 ms  
- Costs nothing on the free tier (1 M requests + 1 GB KV reads / month)

  ![](/docs/ss2.png)

## Tech stack

- **Cloudflare Workers** – serve requests at the edge  
- **D1 (SQLite)** – store user hashes and slug lists  
- **KV** – key/value lookups for lightning-fast redirects  
- **reCAPTCHA v2** – stop bots from burning your quota

## Quick deploy

1. Clone the repo  
2. Create a D1 database named D1_EV and a KV namespace named KV_EV  
3. Add the secret RECAPCHA_KEY (Google reCAPTCHA v2 secret)  
4. npx wrangler deploy

That's it—your own instance is live.

## Local dev

~~~
npm install -g wrangler   # if you don't have it
wrangler dev              # serves on localhost:8787
~~~

## API in two lines

Create:

~~~
curl -X POST 127.0.0.1:8787/api/links/create \
  -H 'content-type: application/json' \
  -d '{"username":"bob","pass_hash":"<scrypt-hash>","destination_url":"https://example.com/very/long","slug":"ex","g-recaptcha-response":"<token>"}'
~~~

List:

~~~
curl -X POST 127.0.0.1:8787/api/links/list \
  -H 'content-type: application/json' \
  -d '{"username":"bob","pass_hash":"<scrypt-hash>"}'
~~~

## Security notes

- Client-side scrypt stretching (N=16384, r=8, p=1, 32 B) before the request ever leaves the browser  
- Server re-hashes the received hash with bcrypt (cost 10) and stores only that  
- All write endpoints require a fresh reCAPTCHA token  
- Reserved-word blacklist prevents hijacking of paths such as api, dash, admin, etc

## Limits on Cloudflare free tier

- 100 000 Worker requests/day  
- 1 GB KV reads/day  
- 1 GB KV writes/month  
- 1 GB D1 storage  

For personal or small-team usage this is effectively unlimited.

## License

MIT – do whatever you want, just don't blame us.

## Contributions

Issues and pull requests are welcome. Open a private security advisory first if you find anything sensitive.
