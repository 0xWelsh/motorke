#!/usr/bin/env bash
# Provision the BIDGARI VM on Oracle Cloud Always Free (Ampere A1, Johannesburg).
#
# Creates, idempotently by display name:
#   VCN        bidgari-vcn      10.0.0.0/16
#   IGW        bidgari-igw      internet egress
#   RouteTable bidgari-rt       0.0.0.0/0 -> IGW
#   SecList    bidgari-sl       ingress 22/80/443, egress all
#   Subnet     bidgari-subnet   10.0.0.0/24, public IPs allowed
#
# Then launches VM.Standard.A1.Flex (2 OCPU / 12 GB) with a 50 GB boot volume.
# Re-running is safe: existing network objects are reused by display name.
#
# HARD LIMITS — Always Free is 2 OCPU + 12 GB RAM + 200 GB block storage total.
# Raising the values below is how people accidentally get billed.
set -euo pipefail

OCI_COMPARTMENT_ID="${OCI_COMPARTMENT_ID:?set OCI_COMPARTMENT_ID (tenancy OCID is fine)}"
VM_SHAPE="${VM_SHAPE:-VM.Standard.A1.Flex}"
VM_OCPUS="${VM_OCPUS:-2}"
VM_MEMORY="${VM_MEMORY:-12}"
VM_BOOT_VOLUME="${VM_BOOT_VOLUME:-50}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519.pub}"
VCN_CIDR="${VCN_CIDR:-10.0.0.0/16}"
SUBNET_CIDR="${SUBNET_CIDR:-10.0.0.0/24}"
INSTANCE_NAME="${INSTANCE_NAME:-bidgari}"

log()  { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

command -v oci >/dev/null || die "OCI CLI not found — see infra/DEPLOY.md"
command -v jq  >/dev/null || die "jq not found — install it (dnf install jq / pacman -S jq)"
[[ -f "$SSH_KEY" ]] || die "SSH public key not found at $SSH_KEY"

if (( VM_OCPUS > 2 || VM_MEMORY > 12 )); then
  die "VM_OCPUS=$VM_OCPUS VM_MEMORY=$VM_MEMORY exceeds Always Free (2 OCPU / 12 GB).
This would be billed. Refusing."
fi

# ── Credentials + availability domains ───────────────────────────────────────
log "Verifying credentials"
AD_LIST="$(oci iam availability-domain list \
  --compartment-id "$OCI_COMPARTMENT_ID" \
  --query 'data[].name' -o text 2>/dev/null \
  | tr -s ' ' '\n' | grep -i 'johannesburg' || true)"

if [[ -z "$AD_LIST" ]]; then
  die "Could not list Johannesburg availability domains.
Either the credentials are wrong, or the tenancy home region is not
af-johannesburg-1. Always Free compute only exists in the home region."
fi
log "ADs: $(echo "$AD_LIST" | tr '\n' ' ')"

# Warn (don't block) if other instances already exist: 2 OCPU is a tenancy-wide pool.
RUNNING_JSON="$(oci compute instance list --compartment-id "$OCI_COMPARTMENT_ID" \
  --lifecycle-state RUNNING --query 'data[].id' -o json 2>/dev/null || echo '[]')"
RUNNING_COUNT="$(echo "$RUNNING_JSON" | jq 'length' 2>/dev/null || echo 0)"
if (( RUNNING_COUNT > 0 )); then
  warn "$RUNNING_COUNT instance(s) already running in this compartment."
  warn "Always Free is 2 OCPU / 12 GB across the whole tenancy."
fi

# ── Network ──────────────────────────────────────────────────────────────────
pick_or_create() { # $1=list-cmd output (id or null)
  [[ -n "${1:-}" && "$1" != "null" ]]
}

log "Ensuring VCN"
VCN_ID="$(oci network vcn list --compartment-id "$OCI_COMPARTMENT_ID" \
  --display-name bidgari-vcn --lifecycle-state AVAILABLE \
  --query 'data[0].id' -o text 2>/dev/null || true)"
if pick_or_create "$VCN_ID"; then
  log "Reusing VCN $VCN_ID"
else
  VCN_ID="$(oci network vcn create --compartment-id "$OCI_COMPARTMENT_ID" \
    --cidr-block "$VCN_CIDR" --display-name bidgari-vcn --dns-label bidgarivcn \
    --wait-for-state AVAILABLE --query 'data.id' -o text)"
  log "Created VCN $VCN_ID"
fi

log "Ensuring internet gateway"
IGW_ID="$(oci network internet-gateway list --compartment-id "$OCI_COMPARTMENT_ID" \
  --vcn-id "$VCN_ID" --display-name bidgari-igw \
  --query 'data[0].id' -o text 2>/dev/null || true)"
if pick_or_create "$IGW_ID"; then
  log "Reusing IGW $IGW_ID"
else
  IGW_ID="$(oci network internet-gateway create --compartment-id "$OCI_COMPARTMENT_ID" \
    --vcn-id "$VCN_ID" --display-name bidgari-igw --is-enabled true \
    --wait-for-state AVAILABLE --query 'data.id' -o text)"
  log "Created IGW $IGW_ID"
fi

log "Ensuring route table"
RT_ID="$(oci network route-table list --compartment-id "$OCI_COMPARTMENT_ID" \
  --vcn-id "$VCN_ID" --display-name bidgari-rt \
  --query 'data[0].id' -o text 2>/dev/null || true)"
if pick_or_create "$RT_ID"; then
  log "Reusing route table $RT_ID"
else
  RT_ID="$(oci network route-table create --compartment-id "$OCI_COMPARTMENT_ID" \
    --vcn-id "$VCN_ID" --display-name bidgari-rt \
    --route-rules "[{\"destination\":\"0.0.0.0/0\",\"destinationType\":\"CIDR_BLOCK\",\"networkEntityId\":\"$IGW_ID\"}]" \
    --wait-for-state AVAILABLE --query 'data.id' -o text)"
  log "Created route table $RT_ID"
fi

log "Ensuring security list (22, 80, 443 open)"
SL_ID="$(oci network security-list list --compartment-id "$OCI_COMPARTMENT_ID" \
  --vcn-id "$VCN_ID" --display-name bidgari-sl \
  --query 'data[0].id' -o text 2>/dev/null || true)"
if pick_or_create "$SL_ID"; then
  log "Reusing security list $SL_ID"
else
  SL_ID="$(oci network security-list create --compartment-id "$OCI_COMPARTMENT_ID" \
    --vcn-id "$VCN_ID" --display-name bidgari-sl \
    --ingress-security-rules '[
      {"protocol":"6","source":"0.0.0.0/0","description":"SSH","tcpOptions":{"destinationPortRange":{"min":22,"max":22}}},
      {"protocol":"6","source":"0.0.0.0/0","description":"HTTP","tcpOptions":{"destinationPortRange":{"min":80,"max":80}}},
      {"protocol":"6","source":"0.0.0.0/0","description":"HTTPS","tcpOptions":{"destinationPortRange":{"min":443,"max":443}}}
    ]' \
    --egress-security-rules '[{"protocol":"all","destination":"0.0.0.0/0","description":"all egress"}]' \
    --wait-for-state AVAILABLE --query 'data.id' -o text)"
  log "Created security list $SL_ID"
fi

log "Ensuring public subnet"
SUBNET_ID="$(oci network subnet list --compartment-id "$OCI_COMPARTMENT_ID" \
  --vcn-id "$VCN_ID" --display-name bidgari-subnet \
  --query 'data[0].id' -o text 2>/dev/null || true)"
if pick_or_create "$SUBNET_ID"; then
  log "Reusing subnet $SUBNET_ID"
else
  SUBNET_ID="$(oci network subnet create --compartment-id "$OCI_COMPARTMENT_ID" \
    --vcn-id "$VCN_ID" --cidr-block "$SUBNET_CIDR" --display-name bidgari-subnet \
    --route-table-id "$RT_ID" --security-list-ids "[\"$SL_ID\"]" \
    --dns-label bidgarisub --wait-for-state AVAILABLE --query 'data.id' -o text)"
  log "Created subnet $SUBNET_ID"
fi

# ── Image ────────────────────────────────────────────────────────────────────
log "Finding an arm64 image"
IMAGE_ID="$(oci compute image list --compartment-id "$OCI_COMPARTMENT_ID" \
  --operating-system "Oracle Linux" --shape "$VM_SHAPE" \
  --sort-by TIMECREATED --sort-order DESC \
  --query 'data[0].id' -o text 2>/dev/null || true)"
if ! pick_or_create "$IMAGE_ID"; then
  warn "No Oracle Linux image found for $VM_SHAPE; trying Ubuntu"
  IMAGE_ID="$(oci compute image list --compartment-id "$OCI_COMPARTMENT_ID" \
    --operating-system "Canonical Ubuntu" --shape "$VM_SHAPE" \
    --sort-by TIMECREATED --sort-order DESC \
    --query 'data[0].id' -o text 2>/dev/null || true)"
fi
pick_or_create "$IMAGE_ID" || die "No arm64 image available in this compartment."
log "Image: $IMAGE_ID"

# ── Launch ───────────────────────────────────────────────────────────────────
# No capacity probe instance: a failed launch creates nothing, so just try each
# AD in turn. A1 capacity is often exhausted — this is the expected failure mode.
META="$(jq -n --arg k "$(tr -d '\n' < "$SSH_KEY")" '{ssh_authorized_keys:$k}')"
INSTANCE_ID=""
for ad in $AD_LIST; do
  log "Launching in $ad"
  if INSTANCE_ID="$(oci compute instance launch \
      --availability-domain "$ad" \
      --compartment-id "$OCI_COMPARTMENT_ID" \
      --shape "$VM_SHAPE" \
      --shape-config "ocpus=$VM_OCPUS,memoryInGBs=$VM_MEMORY" \
      --image-id "$IMAGE_ID" \
      --subnet-id "$SUBNET_ID" \
      --assign-public-ip true \
      --boot-volume-size-in-gbs "$VM_BOOT_VOLUME" \
      --display-name "$INSTANCE_NAME" \
      --metadata "$META" \
      --wait-for-state RUNNING \
      --query 'data.id' -o text 2>/tmp/oci-launch.err)"; then
    break
  fi
  INSTANCE_ID=""
  warn "$ad: launch failed (usually 'Out of host capacity')"
  head -3 /tmp/oci-launch.err 2>/dev/null | sed 's/^/    /' || true
done

[[ -n "$INSTANCE_ID" ]] || die "No AD had A1 capacity right now, or the shape is
not Always Free eligible. Retry in a few hours — failed launches cost nothing."

log "Instance running: $INSTANCE_ID"

PUBLIC_IP="$(oci compute instance list-vnics --instance-id "$INSTANCE_ID" \
  --query 'data[0]."public-ip"' -o text)"

cat <<EOF

  Instance ID : $INSTANCE_ID
  Public IP   : $PUBLIC_IP
  Shape       : $VM_SHAPE (${VM_OCPUS} OCPU / ${VM_MEMORY} GB)
  Boot volume : ${VM_BOOT_VOLUME} GB
  Subnet      : $SUBNET_ID

  Ports 22/80/443 are already open in the cloud security list (bidgari-sl).
  The VM's own firewalld still blocks 80/443 — open it on the host:

    ssh opc@$PUBLIC_IP
    sudo firewall-cmd --permanent --add-service=http --add-service=https
    sudo firewall-cmd --reload

  Then continue at infra/DEPLOY.md step 2 (install Docker).

EOF
