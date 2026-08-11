#!/usr/bin/env bash
# deploy.sh — Build and deploy the WorkVault contract to Stellar Testnet.
# Run from the repo root.
#
# Prerequisites:
#   cargo install --locked stellar-cli --features opt
#   rustup target add wasm32v1-none
#   stellar keys generate --global deployer --network testnet --fund

set -euo pipefail

echo "==> Building contract WASM..."
cargo build -p workvault-vault \
  --target wasm32v1-none \
  --release

WASM="target/wasm32v1-none/release/workvault_vault.wasm"

echo "==> Deploying to Testnet..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM" \
  --source deployer \
  --network testnet)

echo ""
echo "✅ Deployed successfully!"
echo "   Contract ID: $CONTRACT_ID"
echo ""
echo "Next steps:"
echo "  1. Copy the contract ID above"
echo "  2. Add it to frontend/.env.local:"
echo "     NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID"
echo "  3. Restart the Next.js dev server: npm run dev"
