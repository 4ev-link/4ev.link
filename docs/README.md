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


## Security notes

- Client-side scrypt stretching (N=16384, r=8, p=1, 32 B) before the request ever leaves the browser  
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
