# Deploy BIDGARI on Oracle Cloud Always Free

Target: one Ampere A1 VM in Johannesburg running Postgres + Next.js + Caddy,
with Cloudflare in front for CDN/DNS. **$0/month**, no request or CPU quotas.

```
Cloudflare (proxy, TLS, DNS)
        │  Full (strict)
        ▼
   Caddy :80/:443  ──►  app :3000  ──►  db :5432   (all on one VM, localhost hops)
```

Why this shape: Kenya → Cloudflare edge → Johannesburg VM → local Postgres.
No US compute, no EU database round trip.

> Ampere A1 capacity is often exhausted. If `provision-oracle.sh` can't find a
> slot, retry every few hours, or fall back to a €4/mo Hetzner CX22 (the same
> compose stack runs there unchanged).

---

## 0. Prerequisites

- An Oracle Cloud account with home region `af-johannesburg-1`.
  Always Free compute can only be created in the home region.
- OCI CLI configured locally: `oci setup config` (creates `~/.oci/config`).
- Your SSH public key (defaults to `~/.ssh/id_ed25519.pub`).
- The `bidgari.com` zone on Cloudflare.
- A filled-in `.env.production` (see step 3).

---

## 1. Provision the VM

```bash
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..xxxx"
export SSH_KEY="$HOME/.ssh/id_ed25519.pub"
bash infra/provision-oracle.sh
```

The script probes the Johannesburg ADs, launches the VM, and prints the public
IP. Note it down.

**Open the firewall — two layers:**

1. Oracle console → Compute → Instances → *bidgari* → Primary VNIC → Subnet →
   Security List → add ingress rules: TCP 80 and 443 from `0.0.0.0/0`.
2. On the VM (Oracle Linux ships firewalld enabled):

```bash
sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload
```

> Do **not** open 5432. Compose binds Postgres to `127.0.0.1` only.

---

## 2. Install Docker

```bash
ssh -i ~/.ssh/id_ed25519 opc@<PUBLIC_IP>

sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io \
                   docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# log out and back in so the group applies

# 4 GB swap: `next build` is memory-hungry on a 2-OCPU box
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 3. Get the code and environment

```bash
git clone git@github.com:0xWelsh/motorke.git
cd motorke
```

### 3a. `.env` — Compose variables

Compose reads this for `${...}` substitution and for the Postgres password.

```bash
cat > .env <<EOF
POSTGRES_USER=bidgari
POSTGRES_PASSWORD=$(openssl rand -hex 24)
POSTGRES_DB=bidgari
SITE_DOMAIN=bidgari.com
ACME_EMAIL=admin@bidgari.com
EOF
```

### 3b. `.env.production` — the app

```bash
cp .env.production.template .env.production
```

Fill in every value. Two rules that matter:

- **`DATABASE_URL` / `DIRECT_URL` must use `127.0.0.1:5432`** and the same
  password as `.env`. `next build` runs in a host-networked build container and
  prerenders DB-backed pages through that URL. Compose swaps them to `db:5432`
  for the running app.
- `NEXT_PUBLIC_SITE_URL="https://bidgari.com"` — used for canonical URLs,
  OpenGraph, and CSRF origin checks.

`next.config.js` validates required vars at build time and exits on anything
missing, so this step is self-checking.

> The build context is allowed to include `.env.production` so `next build` can
> inline `NEXT_PUBLIC_*` values. That only exists in the builder layer of an
> image you build locally. Don't push this image to a public registry.

---

## 4. Schema, then data

```bash
# Start Postgres first — both the build and the migrator need it.
docker compose up -d db

# Apply prisma/migrations to a fresh local database.
docker compose --profile tools run --rm migrate
```

Now copy production data from Supabase (the dump is tiny — ~50 MB):

```bash
export SOURCE_DATABASE_URL='postgresql://postgres.<ref>:<password>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'
bash infra/migrate-db.sh
```

The script dumps `public` data only (schema comes from migrations) and skips
`_prisma_migrations`, so future `migrate deploy` runs stay consistent. It
expects an **empty** local database — if you re-run it, drop and re-migrate
first.

Verify:

```bash
docker compose exec -T db sh -c \
  'psql -U $POSTGRES_USER -d $POSTGRES_DB -c "select count(*) from cars;"'
```

---

## 5. Build and start

Build **on the VM** (native arm64). Cross-building on an x86 laptop produces
the wrong Prisma/sharp/bcrypt binaries.

```bash
docker compose build app
docker compose up -d
docker compose ps          # db, app, caddy should be running/healthy
docker compose logs -f app
```

Smoke test from the VM:

```bash
curl -fsS http://127.0.0.1:3000/api/health && echo OK
```

---

## 6. DNS and TLS

1. In Cloudflare DNS, point:
   - `A  bidgari.com  →  <PUBLIC_IP>`
   - `CNAME  www  →  bidgari.com`
2. Keep both records **DNS only (grey cloud)** until Caddy has issued a Let's
   Encrypt certificate. Watch it:

   ```bash
   docker compose logs -f caddy   # wait for "certificate obtained"
   ```

3. Confirm `https://bidgari.com` loads directly.
4. Turn the proxy **on (orange cloud)** for both records, then set
   SSL/TLS → Overview → **Full (strict)** and enable **Always Use HTTPS**.

> `welshmotorhub.co.ke` → `bidgari.com` lived in `vercel.json`; that file does
> nothing here. If the old domain still gets traffic, add a Cloudflare
> Redirect Rule (301) for it.

---

## 7. Crons

`.github/workflows/crons.yml` already calls the app over HTTP. In the GitHub
repo → Settings → Secrets → Actions, set:

- `CRON_SECRET` — same value as `.env.production`
- `SITE_URL` is hard-coded in the workflow; update it if the domain changes.

---

## 8. Backups

Nightly logical dump, kept off the database volume:

```bash
mkdir -p /home/opc/backups
cat > /home/opc/backup-db.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd /home/opc/motorke
mkdir -p /home/opc/backups
docker compose exec -T db pg_dump -U bidgari -Fc bidgari \
  > "/home/opc/backups/bidgari-$(date +%F).dump"
find /home/opc/backups -name '*.dump' -mtime +14 -delete
EOF
chmod +x /home/opc/backup-db.sh

(crontab -l 2>/dev/null; echo '15 2 * * * /home/opc/backup-db.sh') | crontab -
```

Copy dumps off the VM periodically (R2, or `scp` to your machine). A backup
that lives only on the same disk is not a backup.

---

## 9. Deploying updates

```bash
cd /home/opc/motorke
git pull
docker compose build app
docker compose --profile tools run --rm migrate
docker compose up -d
```

`docker compose up -d` only recreates the app container. Postgres data lives in
the `pgdata` volume and is untouched.

---

## 10. Keep Supabase alive for 30 days

Don't delete the Supabase project the day you cut over. Keep it as a cold
backup until the VM has run clean for a month. The free project pauses after
idle periods, which is fine — you only need it if you have to roll back.

Before decommissioning, check images: if any listing/dealer images still point
at Supabase Storage, run `node scripts/migrate-to-r2.mjs` and confirm
`R2_PUBLIC_URL` resolves.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Missing required environment variables` during build | `.env.production` is missing a value. The list is in the error. |
| Build fails with `ECONNREFUSED 127.0.0.1:5432` | `db` isn't running, or `.env.production` points at `db:5432` instead of `127.0.0.1:5432`. |
| Caddy can't get a certificate | DNS not pointing at the VM, or ports 80/443 still blocked in the OCI security list / firewalld. |
| `Cannot find module '.prisma/client'` at runtime | Image was cross-built. Rebuild on the VM. |
| `bcrypt` invalid ELF / module load error | Same — rebuild on the VM so node-gyp targets arm64. |
| ISR pages never update | Check `docker compose logs app` for permission errors writing `.next/cache`; the image chowns it to `nextjs`. |
| App restarts under load | 2 OCPU / 12 GB is plenty for this app; check `docker stats` and the swap file. |

## Rollback

1. Point Cloudflare DNS back to Vercel (or your previous host).
2. Vercel will resume serving the last deployment once the pause is lifted.
3. The Supabase project is unchanged until you explicitly delete it.
