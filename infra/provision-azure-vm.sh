#!/usr/bin/env bash
# Provision the BIDGARI VM on Azure for Students (GitHub Student Pack, no card).
#
# Creates, idempotently by name, in South Africa North (Johannesburg — ~93ms
# RTT from Kenya, per the measurements in provision-azure.sh's header):
#   Resource Group  bidgari-prod
#   VNet/Subnet     bidgari-vnet 10.0.0.0/16 / bidgari-subnet 10.0.0.0/24
#   NSG             bidgari-nsg  ingress 22/80/443
#   Public IP       bidgari-ip
#   VM              bidgari      Standard_B2ats_v2 (2 vCPU / 1 GB, x86)
#
# Why a plain VM and not the managed stack in provision-azure.sh: managed
# Postgres (B1ms ~$27/mo) + Container Apps + ACR would burn the $100/yr
# student credit in about a quarter. The docker-compose stack co-locates
# Caddy + Next.js + Postgres on one box for ~$5-10/mo of credit (disk),
# inside the free monthly B-series hours.
#
# RAM is 1 GB, so cloud-init writes a 3 GB swapfile and installs Docker +
# the compose plugin. `next build` inside the builder stage needs the swap;
# runtime does not.
#
# HARD LIMITS — Azure for Students is $100 credit/yr + 750 h/mo of B-series.
# Do NOT create premium disks, load balancers, or public IP SKU Standard
# with idle charges. Re-running this script is safe; objects are reused.
set -euo pipefail

export PATH="$HOME/.local/azcli/bin:$PATH"
export AZ_PYTHON="${AZ_PYTHON:-$(command -v python3)}"

LOCATION="${AZ_LOCATION:-uaenorth}"   # student-subs allow-list (sys.regionrestriction): italynorth, polandcentral, austriaeast, germanywestcentral, uaenorth. Dubai is closest to KE (~120ms).
RG="${AZ_RG:-bidgari-prod}"
VM_NAME="${VM_NAME:-bidgari}"
VM_SIZE="${VM_SIZE:-Standard_B2ats_v2}"   # free-eligible: B1s, B2pts_v2 (ARM), B2ats_v2
VM_IMAGE="${VM_IMAGE:-Ubuntu2404}"
OS_DISK_GB="${OS_DISK_GB:-64}"            # Standard_LRS ~$5.5/mo, covered by credit
VM_USER="${VM_USER:-bidgari}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519.pub}"

log()  { printf '\n\033[1;36m▸ %s\n\033[0m' "$*"; }
warn() { printf '\033[1;33m! %s\n\033[0m' "$*"; }
die()  { printf '\033[1;31m✗ %s\n\033[0m' "$*" >&2; exit 1; }

command -v az >/dev/null || die "az not on PATH — install Azure CLI first (see DEPLOY-AZURE.md)"
az account show >/dev/null 2>&1 || die "not logged in — run: az login --use-device-code"

# Guard against accidentally landing on a non-student subscription.
SUB_TYPE="$(az account show --query 'subscriptionPolicies.subscriptionType' -o tsv 2>/dev/null | tr -d '\r' || true)"
SUB_NAME="$(az account show --query name -o tsv 2>/dev/null || echo unknown)"
log "Subscription: $SUB_NAME (type: ${SUB_TYPE:-unknown})"
if [[ "$SUB_NAME" != *"Student"* && "$SUB_TYPE" != "*Edu*" && "$SUB_TYPE" != "MPN"* && "$SUB_TYPE" != "EA"* ]]; then
  warn "Subscription name/type does not look like Azure for Students. Verify in the portal before spending."
fi

SSH_PUB="$(cat "$SSH_KEY")" || die "no SSH key at $SSH_KEY — generate one: ssh-keygen -t ed25519"

# ── cloud-init: swap + docker ────────────────────────────────────────────────
CLOUD_INIT="$(mktemp /tmp/bidgari-cloudinit.XXXXXX.yaml)"
cat > "$CLOUD_INIT" <<'YAML'
#cloud-config
swap_size: "3G"
package_update: true
package_upgrade: true
write_files:
  - path: /etc/docker/daemon.json
    content: |
      { "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "2" } }
runcmd:
  # Keep build-time memory predictable on a 1 GB box.
  - sysctl -w vm.swappiness=100
  - echo 'vm.swappiness=100' > /etc/sysctl.d/99-swappiness.conf
  - install -m 0755 -d /etc/apt/keyrings
  - curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  - echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
  - apt-get update -y
  - apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  - systemctl enable --now docker
YAML

# ── network ──────────────────────────────────────────────────────────────────
log "Resource group $RG @ $LOCATION"
az group create --name "$RG" --location "$LOCATION" --output none

if az network vnet show -g "$RG" -n bidgari-vnet >/dev/null 2>&1; then
  log "VNet exists, reusing"
else
  log "Creating VNet + subnet"
  az network vnet create -g "$RG" -n bidgari-vnet --location "$LOCATION" \
    --address-prefixes 10.0.0.0/16 \
    --subnet-name bidgari-subnet --subnet-prefixes 10.0.0.0/24 --output none
fi

log "NSG rules (22/80/443 in, all out)"
az network nsg show -g "$RG" -n bidgari-nsg >/dev/null 2>&1 \
  || az network nsg create -g "$RG" --name bidgari-nsg --location "$LOCATION" --output none
for spec in "ssh tcp 22 100" "http tcp 80 110" "https tcp 443 120"; do
  set -- $spec
  az network nsg rule show -g "$RG" --nsg-name bidgari-nsg -n "in-$1" >/dev/null 2>&1 \
    || az network nsg rule create -g "$RG" --nsg-name bidgari-nsg -n "in-$1" \
         --priority "$4" --access Allow --direction Inbound \
         --protocol "$2" --destination-port-ranges "$3" \
         --source-address-prefixes '*' --output none
done

log "Public IP (Standard SKU — free while attached to the VM; Basic SKU is capped at 0 on student subs)"
az network public-ip show -g "$RG" -n bidgari-ip >/dev/null 2>&1 \
  || az network public-ip create -g "$RG" -n bidgari-ip --location "$LOCATION" --sku Standard --allocation-method Static --output none

# ── VM ───────────────────────────────────────────────────────────────────────
if az vm show -g "$RG" -n "$VM_NAME" >/dev/null 2>&1; then
  log "VM $VM_NAME exists, reusing"
else
  log "Creating VM $VM_NAME ($VM_SIZE) — first boot runs cloud-init for ~2-3 min"
  az vm create \
    --resource-group "$RG" --name "$VM_NAME" --location "$LOCATION" \
    --size "$VM_SIZE" --image "$VM_IMAGE" \
    --admin-username "$VM_USER" --ssh-key-values "$SSH_PUB" \
    --storage-sku Standard_LRS --os-disk-size-gb "$OS_DISK_GB" \
    --vnet-name bidgari-vnet --subnet bidgari-subnet \
    --nsg bidgari-nsg \
    --public-ip-address bidgari-ip \
    --custom-data "$CLOUD_INIT" \
    --output none
fi
rm -f "$CLOUD_INIT"

IP="$(az network public-ip show -g "$RG" -n bidgari-ip --query ipAddress -o tsv)"
log "Done."
cat <<EOF

  VM public IP:  $IP
  Next steps:    see infra/DEPLOY-AZURE.md (clone repo, .env.production, docker compose up)

  ssh $VM_USER@$IP

  Reminder — check credit burn monthly:
    az consumption usage list ...  or the portal's Cost Management blade.
EOF
