#!/usr/bin/env bash
# deploy.sh — Build and deploy/update the WorkVault contract on Stellar Testnet or Mainnet.
# Run from the repo root.
#
# Usage:
#   ./scripts/deploy.sh              # Deploy new contract (default = testnet)
#   ./scripts/deploy.sh testnet      # Deploy new contract to testnet
#   ./scripts/deploy.sh mainnet      # Deploy new contract to mainnet
#   ./scripts/deploy.sh testnet update    # Update WASM on existing testnet contract
#   ./scripts/deploy.sh mainnet update    # Update WASM on existing mainnet contract
#
# Prerequisites:
#   cargo install --locked stellar-cli --features opt
#   rustup target add wasm32v1-none
#   stellar keys generate --global deployer --network testnet --fund   (testnet)
#   stellar keys generate --global deployer --network mainnet          (mainnet)
#
# Mainnet requires a funded deployer account (~50 XLM for deployment fees).

set -euo pipefail

NETWORK="${1:-testnet}"
MODE="${2:-deploy}"

# Env file depends on network
if [ "$NETWORK" = "mainnet" ]; then
  ENV_FILE="frontend/.env.mainnet"
  RPC_URL="https://soroban-mainnet.stellar.org"
  PASSPHRASE="Public Global Stellar Network ; September 2015"
  HORIZON_URL="https://horizon.stellar.org"
else
  ENV_FILE="frontend/.env.local"
  RPC_URL="https://soroban-testnet.stellar.org"
  PASSPHRASE="Test SDF Network ; September 2015"
  HORIZON_URL="https://horizon-testnet.stellar.org"
fi

WASM="target/wasm32v1-none/release/workvault_vault.wasm"

# Validate network value
if [ "$NETWORK" != "testnet" ] && [ "$NETWORK" != "mainnet" ]; then
  echo "❌ Unknown network: $NETWORK (use 'testnet' or 'mainnet')"
  exit 1
fi

echo "==> Building contract WASM..."
cargo build -p workvault-vault \
  --target wasm32v1-none \
  --release

if [ "$MODE" = "update" ]; then
  # Read existing contract ID from env file
  if [ ! -f "$ENV_FILE" ]; then
    echo "❌ No $ENV_FILE found. Run without 'update' to deploy fresh."
    exit 1
  fi

  CONTRACT_ID=$(grep "NEXT_PUBLIC_CONTRACT_ID" "$ENV_FILE" | cut -d= -f2 | tr -d '[:space:]')
  if [ -z "$CONTRACT_ID" ]; then
    echo "❌ NEXT_PUBLIC_CONTRACT_ID not set in $ENV_FILE"
    exit 1
  fi

  echo "==> Updating WASM for contract $CONTRACT_ID on $NETWORK..."
  stellar contract install \
    --wasm "$WASM" \
    --source deployer \
    --network "$NETWORK"

  echo ""
  echo "✅ WASM updated on $NETWORK!"
  echo "   Contract ID: $CONTRACT_ID"
else
  echo "==> Deploying new contract to $NETWORK..."
  CONTRACT_ID=$(stellar contract deploy \
    --wasm "$WASM" \
    --source deployer \
    --network "$NETWORK")

  echo ""
  echo "✅ Deployed successfully!"
  echo "   Network: $NETWORK"
  echo "   Contract ID: $CONTRACT_ID"

  # Update/create env file with correct values
  cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID
NEXT_PUBLIC_SOROBAN_RPC_URL=$RPC_URL
NEXT_PUBLIC_NETWORK_PASSPHRASE=$PASSPHRASE
NEXT_PUBLIC_HORIZON_URL=$HORIZON_URL
EOF
  echo "   Wrote $ENV_FILE"
fi

echo ""
echo "Next steps:"
echo "  1. Redeploy frontend: cd frontend && npm run build && vercel --prod"
echo "  2. Verify contract on Stellar Expert: https://stellar.expert/explorer/$NETWORK/contract/$CONTRACT_ID"
echo "  3. If deploying to mainnet, update Vercel env vars to match $ENV_FILE"
if [ "$NETWORK" = "mainnet" ]; then
  echo "  4. ⚠️  MAINNET: Real funds at stake. Confirm the deployer account has sufficient XLM."
  echo "     Friendbot is NOT available on mainnet — buy XLM on an exchange first."
fi
