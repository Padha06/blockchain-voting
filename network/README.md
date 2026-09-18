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

## Option B — classroom demo, no server (temporary)

Run a Hardhat node on the presenting laptop and expose it:

```bash
npx hardhat node                                        # localhost:8545
npx hardhat run scripts/deploy.ts --network localhost
cloudflared tunnel --url http://127.0.0.1:8545         # public https URL
```

Point the Vercel env vars at the tunnel URL. Works for the demo; tear down after.

## Explorer (receipt links)

Receipts link to `NEXT_PUBLIC_EXPLORER_URL`. Pick one:

- **Blockscout** full stack (Postgres + backend + frontend) — best, heaviest.
- Any lightweight EVM viewer pointed at your RPC.
- For staging, deploy the factory to Polygon Amoy instead and use Polygonscan;
  voters then need test MATIC, so this is staging-only, not the zero-gas story.
