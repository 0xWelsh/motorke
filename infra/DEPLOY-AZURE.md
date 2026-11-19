# Deploy BIDGARI on Azure for Students (no credit card)

Target: one B-series VM in **South Africa North (Johannesburg)** running the
same docker-compose stack as `infra/DEPLOY.md` (Caddy → Next.js → Postgres,
all on one box), with Cloudflare Free in front. **$0 cash outlay**, paid from
the $100/yr Azure for Students credit + 750 free B-series hours/month.

Why this over `provision-azure.sh`: that script stood up managed Postgres
(~$27/mo) + Container Apps + ACR, which would eat the whole annual credit in
~3 months. This shape costs ~$5-6/mo of credit (the 64 GB standard disk) and
leaves the rest as headroom.

```
Cloudflare (DNS, proxy, TLS to visitors, CDN at the Nairobi PoP)
        │  Full (strict)
        ▼
   Caddy :80/:443  ──►  app :3000  ──►  db :5432   (localhost hops, 93ms to KE)
```

---

## 0. Prerequisites — one-time, in a browser

1. [education.github.com/pack](https://education.github.com/pack) → **Azure →
   Activate** → copy the one-time code.
2. [signup.azure.com/studentverification?offerType=1](https://signup.azure.com/studentverification?offerType=1)
   → **Sign in with GitHub** → paste the code. No credit card page should
   appear — if it does, you're on the normal sign-up flow, go back.
3. Install the Azure CLI:
   ```bash
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash   # or: pip install azure-cli
   az login --use-device-code
   az account set --subscription "$(az account list --query "[?startsWith(name,'Azure')].id" -o tsv | head -1)"
   ```

**Keep-and-renew rules (the offer's real limits):**
- Renew **every year you're a student** (portal → your subscription → *Renew*,
  open ~30 days before the anniversary). Unrenewed = everything disabled.
- Watch credit burn monthly in **Cost Management**; the $100 is the ceiling.
- Graduating or exhausting credit: the compose stack runs unchanged on a
  €4/mo Hetzner box — your data is just `pg_dump` + an R2 bucket, so exit is
  cheap by design.

## 1. Provision the VM

```bash
export SSH_KEY="$HOME/.ssh/id_ed25519.pub"
bash infra/provision-azure-vm.sh
```

Idempotent; prints the public IP. First boot runs cloud-init (3 GB swap +
Docker) for 2–3 minutes — wait it out before SSHing.

## 2. Deploy the app

SSH to the VM, then follow `infra/DEPLOY.md` steps 2–6 unchanged (they're
VM-generic): clone the repo, create `/opt/bidgari/.env.production` from
`.env.production.template` (set `SITE_DOMAIN`, `ACME_EMAIL`, strong
`POSTGRES_PASSWORD`, regenerate `AUTH_SECRET`), then:

```bash
docker compose up -d db
docker compose --profile tools run --rm migrate     # prisma schema
SOURCE_DATABASE_URL='postgresql://postgres.<ref>:<pw>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres' \
  bash infra/migrate-db.sh                          # copy Supabase data
docker compose up -d --build app caddy
```

On a 1 GB VM the `--build` step leans on swap and takes ~15–25 min. Fine once;
if it gets annoying, move builds to GitHub Actions pushing to GHCR (free for
private images under 500 MB) and pull on the VM instead.

## 3. Cut DNS over to Cloudflare

1. Move/add `bidgari.com` + `www` A records → VM IP. Leave **grey-cloud
   (DNS-only)** until `curl https://bidgari.com` shows a valid Let's Encrypt
   cert from Caddy.
2. Switch to **orange-cloud (proxy)**: static assets then serve from the
   Nairobi PoP; only dynamic HTML makes the 93 ms hop to Johannesburg.
3. SSL/TLS mode: **Full (strict)**. Under Speed → Caching, leave defaults;
   add a cache rule for `/_next/static/*` if you want to be thorough.
4. Vercel crons are already gone — `.github/workflows/crons.yml` calls the
   public `/api/cron/*` URLs, so it follows the domain automatically. Keep
   the Vercel project paused (don't delete yet) until you've verified the
   crons and a full deploy cycle on the VM.

## 4. Backups (the one thing you now own)

```cron
# /etc/cron.d/bidgari — nightly dump to R2 (rclone copy, bucket is already free)
15 2 * * * bidgari docker compose -f /opt/bidgari/docker-compose.yml exec -T db \
  pg_dump -U bidgari bidgari | gzip > /backups/bidgari-$(date +\%F).sql.gz && \
  rclone copy /backups/ r2:bidgari-backups/ --max-age 14d
```

`pg_dump` of a few hundred MB takes seconds locally; egress to R2 is free.

## 5. WhatsApp

Dropped by product decision — `src/app/api/whatsapp-bot/pairing` and
`whatsapp-daemon.js` become dead code and the `whatsapp-digest` cron entry
should be removed from `crons.yml`.
