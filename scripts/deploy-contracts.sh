#!/usr/bin/env bash
set -euo pipefail

# Check soroban CLI is installed
if ! command -v soroban &>/dev/null; then
  echo "Error: soroban CLI not found. Install via: cargo install --locked soroban-cli" >&2
  exit 1
fi

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE="${STELLAR_SOURCE_ACCOUNT:-default}"
ENV_FILE=".env.contracts"

echo "Building contracts..."
cargo build \
  --manifest-path contracts/Cargo.toml \
  --target wasm32-unknown-unknown \
  --release

WASM_DIR="contracts/target/wasm32-unknown-unknown/release"

deploy_contract() {
  local name="$1"
  local wasm="$WASM_DIR/${name}.wasm"

  if [[ ! -f "$wasm" ]]; then
    echo "Warning: $wasm not found, skipping $name" >&2
    return
  fi

  echo "Deploying $name..."
  local contract_id
  contract_id=$(soroban contract deploy \
    --wasm "$wasm" \
    --source "$SOURCE" \
    --network "$NETWORK")

  echo "${name^^}_CONTRACT_ID=$contract_id"
  echo "${name^^}_CONTRACT_ID=$contract_id" >> "$ENV_FILE"
}

# Reset output file
> "$ENV_FILE"
echo "# Deployed contract IDs — $(date -u)" >> "$ENV_FILE"

deploy_contract "stellarhaul_escrow"
deploy_contract "stellarhaul_job"
deploy_contract "stellarhaul_reputation"

echo ""
echo "Contract IDs saved to $ENV_FILE"
cat "$ENV_FILE"
