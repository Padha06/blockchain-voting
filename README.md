# Blockchain Voting — zero-gas college app-chain

Reusable blockchain voting: admin creates election → uploads Excel/CSV → Merkle census →
candidates → start/stop → live dashboard. Voters check roll number, cast one vote with a
free in-browser burner wallet, keep a tx hash verifiable on the college Blockscout.

## What blockchain does (and does not do)

- **Votes** are on-chain: tamper-evident, publicly auditable via `VoteCast` events.
- **Eligibility** is committed on-chain as one Merkle root. Changing the voter list changes the root.
- **Identities** (names, roll nos) stay off-chain. Only leaf hashes go on-chain.
- It does **NOT** stop a dishonest admin stuffing the original list. The roll is trusted; the count is not.

## Quickstart (local, zero gas)

```bash
cd blockchain-voting
cp .env.example .env
npm install
npx hardhat compile
npx hardhat test                       # 8 contract tests
npx hardhat node                       # terminal 1 (chainId 31337 local; app-chain uses 20260)
npx hardhat run scripts/deploy.ts --network localhost   # terminal 2
npx hardhat run scripts/seed-demo.ts --network localhost # 200 voters, 140 votes, live charts
cd web && npm install && npm run dev   # http://localhost:3000
```

College app-chain: `docker compose -f network/docker-compose.yml up -d` (Geth Clique,
`gasPrice 0`, RPC `:8545`), then `npx hardhat run scripts/deploy.ts --network appchain`.

## Demo walkthrough

1. Open `/admin` → New election → add 2+ candidates → upload class XLSX → preview
   (`valid · errors · warnings`) → Build census (downloads JSON) →
   drop into `web/public/census/<addr>.json` → deploy via factory.
2. Manage page → Start. Share `/vote/<addr>`.
3. Student: type roll no → confirm name → pick candidate → confirm (gasPrice 0) →
   receipt card with tx hash + Blockscout link + Copy button.
4. `/admin/<addr>/dashboard`: KPIs, turnout gauge, bar + donut, votes-over-time,
   turnout by department/year, results table with CSV export. Seed script guarantees
   non-empty charts.

## Known limitations

1. Votes link leaf→candidate publicly; anyone with the census maps roll→vote. Salt stops
   outsiders, not the admin. Path: commit-reveal, then MACI.
2. Admin controls the roll and (on the app-chain) the validators.
3. Live tallies visible on-chain may influence late voters (dashboard toggle is UX only).
4. Census is a static file; a mismatched file is detected by root check but needs redeploy/IPFS.
5. For institutional elections (clubs, colleges, societies). Not for binding public elections.
