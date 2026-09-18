#!/bin/sh
# One-time chain init. Run on the host that will run the validator.
# Requires Docker. Safe to re-run (import is idempotent via `|| true`).
set -e
cd "$(dirname "$0")"
docker compose --profile init run --rm init
echo "Chain initialised. Start with: docker compose up -d"
echo "RPC will be http://HOST:8545 (chainId 20260, gasPrice 0)."
