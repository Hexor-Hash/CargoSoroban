#!/usr/bin/env bash
set -euo pipefail

# Check soroban CLI is installed
if ! command -v soroban &>/dev/null; then
  echo "Error: soroban CLI not found. Install via: cargo install --locked soroban-cli" >&2
  exit 1
fi

IDENTITY="stellarhaul-testnet"

echo "Generating testnet keypair for identity: $IDENTITY"
soroban keys generate --network testnet "$IDENTITY" 2>/dev/null || true

PUBLIC_KEY=$(soroban keys address "$IDENTITY")
SECRET_KEY=$(soroban keys show "$IDENTITY")

echo ""
echo "Public Key:  $PUBLIC_KEY"
echo "Secret Key:  $SECRET_KEY"

echo ""
echo "Funding account via Friendbot..."
curl -s "https://friendbot.stellar.org?addr=${PUBLIC_KEY}" | \
  python3 -c "import sys,json; r=json.load(sys.stdin); print('Funded!' if 'hash' in r else r)" \
  2>/dev/null || \
  curl -s "https://friendbot.stellar.org?addr=${PUBLIC_KEY}" > /dev/null && echo "Funded!"

echo ""
echo "Add the following to your backend/.env:"
echo "  STELLAR_SECRET_KEY=$SECRET_KEY"
echo "  STELLAR_PUBLIC_KEY=$PUBLIC_KEY"
echo "  STELLAR_NETWORK=TESTNET"
echo "  STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org"
