#!/usr/bin/env bash
# Provision an Oracle Cloud Always Free VM in Johannesburg and deploy BIDGARI.
#
# Why Oracle: it is the only provider offering a genuinely free tier in an
# African region. Always Free resources never expire and have no credit cliff —
# the failure mode that suspended Supabase cannot happen here. Compute and
# Postgres run on the same machine, so the database round trip stays local.
#
# The Ampere A1 shape is ARM64. Docker builds run natively on the VM, so no
# cross-compilation or QEMU emulation is involved.
#
# You must supply OCI credentials with permission to create compute and a VCN.
set -euo pipefail

OCI_COMPARTMENT_ID="${OCI_COMPARTMENT_ID:?set OCI_COMPARTMENT_ID}"
OCI_AD="${OCI_AD:-AD-1}"
VM_SHAPE="${VM_SHAPE:-VM.Standard.A1.Flex}"
VM_OCPUS="${VM_OCPUS:-2}"          # Always Free allows 2 OCPU total
VM_MEMORY="${VM_MEMORY:-12}"       # Always Free allows 12 GB total
VM_BOOT_VOLUME="${VM_BOOT_VOLUME:-50}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519.pub}"

log()  { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

command -v oci >/dev/null || die "OCI CLI not found — see infra/README.md"
oci --version >/dev/null 2>&1 || die "OCI CLI not configured — run: oci setup config"
[[ -f "$SSH_KEY" ]] || die "SSH public key not found at $SSH_KEY"

# ── Locate the Johannesburg ADs ───────────────────────────────────────────────
log "Finding Johannesburg availability domains"
AD_LIST="$(oci compute availability-domain list --compartment-id "$OCI_COMPARTMENT_ID" \
  --query 'data[?contains(name,"johannesburg")].name' -o text 2>/dev/null | tr -s ' ' '\n' | grep -i jhb | head -3)"

if [[ -z "$AD_LIST" ]]; then
  die "No Johannesburg ADs found. Confirm your tenancy home region is
af-johannesburg-1 — Always Free compute can only be created in the home region."
fi
log "Available ADs: $(echo "$AD_LIST" | tr '\n' ' ')"

AD_OK=""
while read -r ad; do
  [[ -z "$ad" ]] && continue
  log "Probing capacity in $ad"
  if oci compute instance launch \
      --availability-domain "$ad" \
      --compartment-id "$OCI_COMPARTMENT_ID" \
      --shape "$VM_SHAPE" \
      --shape-config "ocpus=$VM_OCPUS,memoryInGBs=$VM_MEMORY" \
      --image-id "$(oci compute image list --compartment-id "$OCI_COMPARTMENT_ID" \
           --operating-system "Oracle Linux" --query 'data[0].id' -o text)" \
      --display-name bidgari-probe \
      --metadata "ssh_authorized_keys=$(cat "$SSH_KEY")" \
      --assign-public-ip true \
      --wait-for-state RUNNING >/dev/null 2>&1; then
    AD_OK="$ad"
    warn "capacity found — deleting probe instance"
    oci compute instance terminate --instance-id \
      "$(oci compute instance list --compartment-id "$OCI_COMPARTMENT_ID" \
         --display-name bidgari-probe --query 'data[0].id' -o text)" --wait >/dev/null 2>&1 || true
    break
  else
    warn "$ad is out of capacity (common for A1 — try again later or pick another AD)"
  fi
done <<< "$AD_LIST"

[[ -n "$AD_OK" ]] || die "No capacity in any Johannesburg AD. Ampere A1 capacity
is frequently exhausted — this is the single biggest risk with Oracle's free
tier. Retry in a few hours, or fall back to Neon."

# ── Launch the real instance ──────────────────────────────────────────────────
log "Launching BIDGARI VM in $AD_OK (${VM_OCPUS} OCPU / ${VM_MEMORY} GB)"
IMAGE_ID="$(oci compute image list --compartment-id "$OCI_COMPARTMENT_ID" \
  --operating-system "Oracle Linux" --query 'data[0].id' -o text)"

INSTANCE_JSON="$(oci compute instance launch \
  --availability-domain "$AD_OK" \
  --compartment-id "$OCI_COMPARTMENT_ID" \
  --shape "$VM_SHAPE" \
  --shape-config "ocpus=$VM_OCPUS,memoryInGBs=$VM_MEMORY" \
  --image-id "$IMAGE_ID" \
  --display-name bidgari \
  --metadata "ssh_authorized_keys=$(cat "$SSH_KEY")" \
  --assign-public-ip true \
  --wait-for-state RUNNING)"

INSTANCE_ID="$(echo "$INSTANCE_JSON" | jq -r '.data.id')"
log "Instance: $INSTANCE_ID"

# ── Attach a 50 GB boot volume ────────────────────────────────────────────────
log "Creating boot volume (${VM_BOOT_VOLUME} GB)"
BOOT_VOLUME_ID="$(oci compute volume create \
  --availability-domain "$AD_OK" \
  --compartment-id "$OCI_COMPARTMENT_ID" \
  --display-name bidgari-boot \
  --size-in-gbs "$VM_BOOT_VOLUME" \
  --vpus-per-gb 0 \
  --image-id "$IMAGE_ID" \
  --wait-for-state AVAILABLE \
  --query 'data.id' -o text)"

log "Attaching boot volume"
if oci compute volume attachment create \
    --compartment-id "$OCI_COMPARTMENT_ID" \
    --availability-domain "$AD_OK" \
    --instance-id "$INSTANCE_ID" \
    --volume-id "$BOOT_VOLUME_ID" \
    --device "/dev/oracleoci/oraclevdb" \
    --is-boot-volume true \
    --wait-for-state ATTACHED >/dev/null 2>&1; then
  log "boot volume attached"
else
  warn "could not attach the volume automatically"
  warn "the default boot volume is 50 GB — if you need more, resize it in the console"
fi

# ── Get the public IP ─────────────────────────────────────────────────────────
PUBLIC_IP="$(oci compute instance list-vnics --instance-id "$INSTANCE_ID" \
  --query 'data[0]."public-ip"' -o text)"

cat <<EOF

$(log "VM ready")

  Instance ID : $INSTANCE_ID
  Public IP   : $PUBLIC_IP
  AD          : $AD_OK
  Shape       : $VM_SHAPE (${VM_OCPUS} OCPU / ${VM_MEMORY} GB)

$(log "Manual step — open the firewall")

  Oracle's default VCN security list only allows SSH. In the console:

    Compute → Instances → bidgari → Primary VNIC → Subnet → Security List
    Add an ingress rule:  TCP  80 and 443  source 0.0.0.0/0

  Until you do, Cloudflare cannot reach the VM.

Next, on the VM:

  ssh -i ~/.ssh/id_ed25519 opc@$PUBLIC_IP
  # then follow infra/DEPLOY.md

EOF