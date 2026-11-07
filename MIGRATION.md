# BIDGARI Migration: Vercel + Supabase → Cloudflare Pages + Neon + R2

## Overview
Migration from paid Vercel Hobby + Supabase Free to **fully free** Cloudflare Pages + Neon PostgreSQL + Cloudflare R2.

**Cost: $0/month** — all services have generous free tiers with no credit card traps.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare (DNS, CDN, WAF, Turnstile)                     │
├─────────────────────────────────────────────────────────────┤
│  Cloudflare Pages (Next.js) ──→ Neon (PostgreSQL)          │
│       │                              │                      │
│       │                              └── 0.5GB free,       │
│       │                                 scale-to-zero,     │
│       │                                 branching           │
│       │                                                         │
│       └──→ Cloudflare R2 (10GB free) ──→ Car images         │
│       └──→ Cloudflare Workers ──→ Cron jobs, APIs           │
│       └──→ GitHub Actions ──→ CI/CD, scheduled tasks        │
└─────────────────────────────────────────────────────────────┘
```

---

## Services & Free Tier Limits

| Service | Free Tier | BIDGARI Usage |
|---------|-----------|---------------|
| **Cloudflare Pages** | Unlimited bandwidth, custom domains, 500 builds/mo | Hosting |
| **Neon** | 0.5GB storage, scale-to-zero, 10 branches | Database |
| **Cloudflare R2** | 10GB storage, Class A/B ops free | Car images |
| **Cloudflare Workers** | 100k req/day, 10ms CPU | Cron, edge logic |
| **Cloudflare Turnstile** | Unlimited | Captcha |
| **GitHub Actions** | 2000 min/mo (public) / 500 (private) | CI/CD, crons |
| **Resend** | 3k emails/mo | Transactional email |
| **UptimeRobot** | 50 monitors, 5-min checks | Uptime |

---

## Migration Steps

### 1. Set Up Neon Database (5 min)
```bash
# Option A: Neon CLI
npm i -g neonctl
neonctl auth
neonctl projects create --name motorke --region eu-west-1

# Option B: neon.tech UI
# 1. Create project "motorke"
# 2. Region: EU West (closest to Kenya)
# 3. Copy connection strings
```

**Required env vars:**
```bash
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### 2. Set Up Cloudflare R2 (3 min)
```bash
# Cloudflare Dashboard → R2 → Create bucket "motorke-images"
# → Settings → Allow public access (for car images)
# → Manage API Tokens → Create token with R2:Edit permissions
```

**Required env vars:**
```bash
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="motorke-images"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"  # or custom domain images.bidgari.com
```

### 3. Set Up Resend Email (2 min)
```bash
# resend.com → API Keys → Create key
# Verify domain bidgari.com (add DNS records)
```

**Required env vars:**
```bash
RESEND_API_KEY="re_..."
# Plus sender addresses (configure in Resend):
MAIL_FROM_VERIFICATION="verify@bidgari.com"
MAIL_FROM_NOREPLY="noreply@bidgari.com"
MAIL_FROM_ALERTS="alerts@bidgari.com"
MAIL_FROM_MARKETING="marketing@bidgari.com"
MAIL_FROM_HELLO="hello@bidgari.com"
MAIL_SUPPORT="support@bidgari.com"
```

### 4. Deploy to Cloudflare Pages (10 min)
```bash
# 1. Push code to GitHub
# 2. Cloudflare Dashboard → Pages → Connect to Git
# 3. Build settings:
#    - Framework: Next.js
#    - Build command: npm run build
#    - Output directory: .vercel/output/static (handled by @opennextjs/cloudflare)
# 4. Environment variables: Add all from .env.production.template
# 5. Custom domain: bidgari.com (Cloudflare DNS)
# 6. Deploy!
```

### 5. Configure GitHub Actions Crons (2 min)
```bash
# GitHub repo → Settings → Secrets → Actions
# Add: CRON_SECRET (generate: openssl rand -base64 32)
# Add: SITE_URL = https://bidgari.com
# Workflow .github/workflows/crons.yml will run automatically
```

### 6. Migrate Database (5 min)
```bash
# Local or CI:
npm run db:deploy  # Runs migrations via scripts/migrate-deploy.sh
# Or:
npx prisma migrate deploy
```

### 7. Migrate Images to R2 (15 min)
```bash
# Script to migrate from Supabase Storage / local uploads to R2
# Run once after R2 is configured
npm run migrate:images  # Create this script if needed
```

### 8. WAHA (WhatsApp) — Separate Decision
**Option A: Railway Free Tier** (500h/mo)
- Deploy `services/growth-agent` to Railway
- Add WAHA as separate Railway service

**Option B: Hetzner VPS** (€4/mo, predictable)
- Small CX22: 2 vCPU, 4GB RAM, 40GB SSD
- Run WAHA + growth-agent via docker-compose

**Option C: Cloudflare Workers + Durable Objects** (experimental)
- Not recommended for WhatsApp WebSocket persistence

---

## Files Created/Modified

### New Files
| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Cloudflare Pages configuration |
| `.github/workflows/crons.yml` | GitHub Actions cron jobs (replaces Vercel crons) |
| `.env.production.template` | Production env var template |

### Modified Files
| File | Changes |
|------|---------|
| `next.config.js` | Removed `output: standalone`, updated image domains for R2 |
| `src/lib/validate-env.js` | Updated required vars for new stack (Resend, R2, CRON_SECRET) |
| `src/lib/mail.js` | Added Resend support with SMTP fallback, unified send logic |

---

## Pre-Deployment Checklist

- [ ] Neon project created, connection strings saved
- [ ] R2 bucket created, public access enabled, API token created
- [ ] Resend account created, domain verified, API key saved
- [ ] Cloudflare Turnstile site key/secret configured
- [ ] GitHub repo connected to Cloudflare Pages
- [ ] All env vars from `.env.production.template` added to Cloudflare Pages
- [ ] `CRON_SECRET` added to GitHub Actions secrets
- [ ] Custom domain `bidgari.com` configured on Cloudflare Pages
- [ ] DNS: `bidgari.com` → Cloudflare Pages (CNAME)
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Images migrated to R2
- [ ] WAHA deployed separately (Railway/Hetzner)

---

## Post-Deployment Verification

```bash
# Health checks
curl https://bidgari.com/api/health
curl https://bidgari.com/api/cron/better-deals -H "Authorization: Bearer $CRON_SECRET"

# Test email
curl -X POST https://bidgari.com/api/auth/signup -d '{"email":"test@example.com","name":"Test"}'

# Test image upload (via admin panel)
# Test M-Pesa callback
# Test WhatsApp integration
```

---

## Rollback Plan

If issues arise:
1. **DNS**: Point `bidgari.com` back to Vercel (vercel.json redirects still work)
2. **Database**: Neon branching allows instant rollback to pre-migration branch
3. **Images**: Supabase Storage still accessible during transition
4. **Cron**: Vercel crons still active until disabled

---

## Cost Comparison

| Component | Before (Vercel + Supabase) | After (Cloudflare + Neon + R2) |
|-----------|---------------------------|-------------------------------|
| Hosting | $20/mo (Vercel Pro) | $0 |
| Database | $0 (Supabase Free, limited) | $0 (Neon 0.5GB) |
| Images | $0 (Supabase, limited) | $0 (R2 10GB) |
| Email | $0 (Zoho, limited) | $0 (Resend 3k) |
| Cron | Included in Vercel | $0 (GitHub Actions) |
| **Total** | **~$20/mo** | **$0/mo** |

---

## Support

- **Cloudflare Pages docs**: https://developers.cloudflare.com/pages/
- **Neon docs**: https://neon.tech/docs
- **R2 docs**: https://developers.cloudflare.com/r2/
- **Resend docs**: https://resend.com/docs
- **@opennextjs/cloudflare**: https://github.com/cloudflare/next-on-pages

---

Generated: $(date)
BIDGARI Team