# Docker Setup for 4ev.link

Run the 4ev.link URL shortener locally with Docker.

## Quick Start

### 1. Configure Environment

Create `.dev.vars` with your reCAPTCHA keys:

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your keys from https://www.google.com/recaptcha/admin
```

**Important:** Add `localhost` and `127.0.0.1` to your reCAPTCHA domain whitelist.

### 2. Start Server

```bash
docker-compose up
```

Access at **http://localhost:8787**

### 3. Initialize Database (First Run Only)

```bash
docker-compose exec 4ev-link sh
npx wrangler d1 execute D1_EV --local --command "CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, pass_hash TEXT NOT NULL, custom_slugs TEXT DEFAULT '[]', created_at INTEGER DEFAULT (strftime('%s', 'now')));"
exit
```

### 4. Stop Server

```bash
docker-compose down
```

## Common Commands

- **Rebuild:** `docker-compose build`
- **View logs:** `docker-compose logs -f`
- **Restart:** `docker-compose restart`
- **Shell access:** `docker-compose exec 4ev-link sh`

## Production Deployment

```bash
# 1. Create D1 database
npx wrangler d1 create D1_EV

# 2. Create KV namespace
npx wrangler kv:namespace create KV_EV

# 3. Update wrangler.toml with the returned IDs and add your site key:
#    [[d1_databases]]
#    database_id = "abc123..."
#    
#    [[kv_namespaces]]
#    id = "xyz789..."
#    
#    [vars]
#    RECAPTCHA_SITE_KEY = "your-public-site-key"

# 4. Initialize D1 schema
npx wrangler d1 execute D1_EV --remote --command "CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, pass_hash TEXT NOT NULL, custom_slugs TEXT DEFAULT '[]', created_at INTEGER DEFAULT (strftime('%s', 'now')));"

# 5. Set reCAPTCHA secret key
npx wrangler secret put RECAPCHA_KEY

# 6. Deploy
npx wrangler pages deploy .
```

## Troubleshooting

**Port conflict:** Change `8787:8787` to `3000:8787` in `docker-compose.yml`  
**Changes not reflected:** Run `docker-compose restart`

## Notes

- Local dev only - production runs on Cloudflare edge
- Data persists in Docker volumes: `node_modules`, `wrangler_data`
- Hot reload enabled via volume mount
