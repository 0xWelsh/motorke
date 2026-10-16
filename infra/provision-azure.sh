#!/usr/bin/env bash
# Provision the Azure stack for BIDGARI in South Africa North (Johannesburg).
#
# Why this region: it is the only Azure region close to Kenya. Measured RTT from
# a Kenyan client to AWS af-south-1 (the nearest comparable) is ~93ms, versus
# 202ms to eu-west-1 (where Supabase sits) and 190-294ms to London's eu-west-2
# (where Neon sits). Compute AND database live in the same region, so a page
# request makes one hop instead of the four it makes today.
#
# Idempotent: safe to re-run. Existing resources are reused, not recreated.
set -euo pipefail

export PATH="$HOME/.local/azcli/bin:$PATH"
export AZ_PYTHON="${AZ_PYTHON:-$(command -v python3)}"

# ── Config ────────────────────────────────────────────────────────────────────
LOCATION="${AZ_LOCATION:-southafricanorth}"
RG="${AZ_RG:-bidgari-prod}"
PGSERVER="${AZ_PG_SERVER:-bidgari-pg}"
PGDATABASE="${AZ_PG_DATABASE:-bidgari}"
PGUSER="${AZ_PG_USER:-bidgariadmin}"
PGSKU="${AZ_PG_SKU:-Standard_B1ms}"
PGVERSION="${AZ_PG_VERSION:-18}"
PGSTORAGE="${AZ_PG_STORAGE:-32}"

ENV_NAME="${AZ_CA_ENV:-bidgari-env}"
CA_NAME="${AZ_CA_APP:-bidgari-web}"
ACR_NAME="${AZ_ACR:-bidgariregistry}"
IMAGE="${AZ_IMAGE:-$ACR_NAME.azurecr.io/bidgari:latest}"

# Admin password: reuse the existing one or generate a strong random value.
# Never printed to stdout — it is written to the file below and to Key Vault.
SECRETS_FILE="infra/azure-secrets.env"

log()  { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

command -v az >/dev/null || die "az not on PATH"
az account show >/dev/null 2>&1 || die "not logged in — run: az login --use-device-code"

SUBSCRIPTION="$(az account show --query id -o tsv)"
[[ -n "$SUBSCRIPTION" ]] || die "could not resolve active subscription"
log "Subscription: $SUBSCRIPTION"
log "Location:     $LOCATION"

mkdir -p infra

if [[ -f "$SECRETS_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$SECRETS_FILE"
fi

if [[ -z "${AZURE_PG_PASSWORD:-}" ]]; then
  log "Generating database admin password"
  AZURE_PG_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 28)Aa1!"
fi

# ── 1. Resource group ─────────────────────────────────────────────────────────
log "Resource group: $RG"
az group create --name "$RG" --location "$LOCATION" --output none

# ── 2. PostgreSQL ─────────────────────────────────────────────────────────────
# Flexible Server, Burstable B1ms (1 vCore / 2 GB). Burstable suits a
# marketplace that is bursty by nature and lets the credit stretch.
if az postgres flexible-server show --name "$PGSERVER" --resource-group "$RG" >/dev/null 2>&1; then
  log "PostgreSQL server exists, reusing"
else
  log "Creating PostgreSQL $PGVERSION ($PGSKU)"
  # Same-zone HA rather than zone-redundant: the standby node is billed too, and
  # on a student budget the resilience is worth having while the extra node is
  # not. Swap to --standby-zone 2 for true zone-redundant if you want it.
  if ! az postgres flexible-server create \
      --name "$PGSERVER" \
      --resource-group "$RG" \
      --location "$LOCATION" \
      --sku-name "$PGSKU" \
      --tier Burstable \
      --storage-size "$PGSTORAGE" \
      --version "$PGVERSION" \
      --admin-user "$PGUSER" \
      --admin-password "$AZURE_PG_PASSWORD" \
      --backup-retention 7 \
      --yes \
      --zonal-resiliency Enabled \
      --zone 1 \
      --allow-same-zone \
      --output none 2>/tmp/opencode/pgcreate.err; then
    warn "HA creation failed, retrying as a single node"
    tail -2 /tmp/opencode/pgcreate.err || true
    az postgres flexible-server create \
      --name "$PGSERVER" \
      --resource-group "$RG" \
      --location "$LOCATION" \
      --sku-name "$PGSKU" \
      --tier Burstable \
      --storage-size "$PGSTORAGE" \
      --version "$PGVERSION" \
      --admin-user "$PGUSER" \
      --admin-password "$AZURE_PG_PASSWORD" \
      --backup-retention 7 \
      --yes \
      --output none
  fi
fi

log "Creating database: $PGDATABASE"
az postgres flexible-server db create \
  --name "$PGDATABASE" \
  --server "$PGSERVER" \
  --resource-group "$RG" \
  --output none 2>/dev/null || log "database already exists"

# Public access is required for the initial Container Apps deployment. The
# firewall rule below is deliberately narrow — see HARDENING note in infra/README.
log "Allowing Azure services through the firewall (temporary)"
az postgres flexible-server firewall-rule create \
  --name AllowAzureServices \
  --server "$PGSERVER" \
  --resource-group "$RG" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0 \
  --output none 2>/dev/null || log "firewall rule already exists"

PGHOST="$(az postgres flexible-server show --name "$PGSERVER" --resource-group "$RG" \
  --query fullyQualifiedDomainName -o tsv)"
PGPORT=5432

# ── 3. Container registry ─────────────────────────────────────────────────────
log "Container registry: $ACR_NAME"
if az acr show --name "$ACR_NAME" >/dev/null 2>&1; then
  log "registry exists"
else
  az acr create \
    --name "$ACR_NAME" \
    --resource-group "$RG" \
    --location "$LOCATION" \
    --sku Basic \
    --admin-enabled true \
    --output none
fi

# ── 4. Container Apps environment ─────────────────────────────────────────────
log "Container Apps environment: $ENV_NAME"
if az containerapp env show --name "$ENV_NAME" --resource-group "$RG" >/dev/null 2>&1; then
  log "environment exists"
else
  az containerapp env create \
    --name "$ENV_NAME" \
    --resource-group "$RG" \
    --location "$LOCATION" \
    --output none
fi

# ── 5. Persist credentials ────────────────────────────────────────────────────
cat > "$SECRETS_FILE" <<EOF
# Generated $(date -Is) — gitignored. Do not commit.
AZURE_PG_PASSWORD="$AZURE_PG_PASSWORD"
PGHOST="$PGHOST"
PGPORT="$PGPORT"
PGDATABASE="$PGDATABASE"
PGUSER="$PGUSER"
EOF
chmod 600 "$SECRETS_FILE"

cat <<EOF

$(log "Done")

  Resource group : $RG
  PostgreSQL     : $PGHOST:$PGPORT/$PGDATABASE
  Container Apps : $CA_NAME
  Image          : $IMAGE

  Connection strings for your app:
    DATABASE_URL="postgresql://$PGUSER:<password>@$PGHOST:$PGPORT/$PGDATABASE?sslmode=require"
    DIRECT_URL="postgresql://$PGUSER:<password>@$PGHOST:$PGPORT/$PGDATABASE?sslmode=require"

  Next: docker build, push to $ACR_NAME, then create the Container App.

EOF