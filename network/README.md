# College app-chain — bring-up guide

Single Geth Clique validator, `gasPrice 0`, chainId **20260**, 2s blocks.
`sealer.key` is the **public Hardhat test key** (`0xf39F…`) — fine for staging,
**replace before anything real**: generate a fresh key, put its address in
`genesis.json` `extraData` (after the 32-byte vanity) and in `alloc`, then re-init.

## Option A — VPS / always-on machine (for the shareable deployment)

```bash
# on the server, with Docker installed
cd network
./init.sh
docker compose up -d
curl -s -X POST -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://127.0.0.1:8545
```

Open firewall port **8545** (or put Nginx/Caddy with HTTPS in front — recommended).
Your public RPC is then `https://rpc.your-college.edu`.

Deploy the factory (from this repo, anywhere with Node):

```bash
cp .env.example .env   # fill APPCHAIN_RPC_URL + DEPLOYER_PRIVATE_KEY
npm install
npx hardhat run scripts/deploy.ts --network appchain
```

`deployment.json` prints the factory address. In Vercel → project →
Environment Variables set:

- `NEXT_PUBLIC_RPC_URL` = your public RPC
- `NEXT_PUBLIC_CHAIN_ID` = 20260
- `NEXT_PUBLIC_FACTORY_ADDRESS` = factory address from deployment.json
- `NEXT_PUBLIC_EXPLORER_URL` = your explorer URL

Redeploy. The wizard's **Deploy on-chain** button activates automatically.

## Option B — classroom demo, no server (temporary, PROVEN recipe)

Run the zero-gas chain on the presenting laptop and expose it. Proven end-to-end:
200 voters + 140 `gasPrice: 0` votes mine cleanly on this setup.

```bat
:: terminal 1 — start chain (repo root)
start-chain.bat
:: terminal 2 — deploy factory + seed demo data
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/seed-demo.ts --network localhost
```

Install cloudflared, then expose the RPC (free quick tunnel):

```bash
cloudflared tunnel --url http://127.0.0.1:8545
```

Copy the `https://…trycloudflare.com` URL. In Vercel → project →
Environment Variables (visibility: plain/config, NOT secret — `NEXT_PUBLIC_`
values ship in the browser bundle), set:

- `NEXT_PUBLIC_RPC_URL` = your tunnel URL
- `NEXT_PUBLIC_CHAIN_ID` = 31337
- `NEXT_PUBLIC_FACTORY_ADDRESS` = factory address from `deployment.json`
- `NEXT_PUBLIC_EXPLORER_URL` = your tunnel URL (receipts link here until a real
  explorer exists; tx lookup via RPC works)

Redeploy. The wizard's **Deploy on-chain** button activates. Admin connects
MetaMask (import hardhat account #0, add custom network: tunnel URL, chainId
31337) and deploys — voters use free in-browser burner wallets.

Keep the laptop + tunnel online for the whole demo. Tear down after.

## Explorer (receipt links)

Receipts link to `NEXT_PUBLIC_EXPLORER_URL`. Pick one:

- **Blockscout** full stack (Postgres + backend + frontend) — best, heaviest.
- Any lightweight EVM viewer pointed at your RPC.
- For staging, deploy the factory to Polygon Amoy instead and use Polygonscan;
  voters then need test MATIC, so this is staging-only, not the zero-gas story.
