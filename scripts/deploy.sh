#!/usr/bin/env bash
# deploy.sh — Build and deploy/update the WorkVault contract on Stellar Testnet.
# Run from the repo root.
#
# Usage:
#   ./scripts/deploy.sh              # Deploy new contract (fresh)
#   ./scripts/deploy.sh update       # Update WASM on existing contract
#
# Prerequisites:
#   cargo install --locked stellar-cli --features opt
#   rustup target add wasm32v1-none
#   stellar keys generate --global deployer --network testnet --fund

set -euo pipefail

ENV_FILE="frontend/.env.local"
WASM="target/wasm32v1-none/release/workvault_vault.wasm"
MODE="${1:-deploy}"

echo "==> Building contract WASM..."
cargo build -p workvault-vault \
  --target wasm32v1-none \
  --release

if [ "$MODE" = "update" ]; then
  # Read existing contract ID from .env.local
  if [ ! -f "$ENV_FILE" ]; then
    echo "❌ No .env.local found. Run without 'update' to deploy fresh."
    exit 1
  fi

  CONTRACT_ID=$(grep "NEXT_PUBLIC_CONTRACT_ID" "$ENV_FILE" | cut -d= -f2 | tr -d '[:space:]')
  if [ -z "$CONTRACT_ID" ]; then
    echo "❌ NEXT_PUBLIC_CONTRACT_ID not set in $ENV_FILE"
    exit 1
  fi

  echo "==> Updating WASM for contract $CONTRACT_ID..."
  stellar contract install \
    --wasm "$WASM" \
    --source deployer \
    --network testnet

  echo ""
  echo "✅ WASM updated on Testnet!"
  echo "   Contract ID: $CONTRACT_ID"
  echo "   (env.local unchanged — same contract ID)"
else
  echo "==> Deploying new contract to Testnet..."
  CONTRACT_ID=$(stellar contract deploy \
    --wasm "$WASM" \
    --source deployer \
    --network testnet)

  echo ""
  echo "✅ Deployed successfully!"
  echo "   Contract ID: $CONTRACT_ID"

  # Update .env.local
  if [ -f "$ENV_FILE" ]; then
    sed -i "s|^NEXT_PUBLIC_CONTRACT_ID=.*|NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID|" "$ENV_FILE"
    echo "   Updated $ENV_FILE"
  else
    echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID" > "$ENV_FILE"
    echo "   Created $ENV_FILE"
  fi
fi

echo ""
echo "Next steps:"
echo "  1. Redeploy frontend: cd frontend && npm run build && vercel --prod"
echo "  2. Update ON_CHAIN_PROOF.md with the new contract address"
