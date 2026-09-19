# Handover guide — read this first (5 minutes, no tech background needed)

You received **BlockVote**: a website for running elections where every vote is
recorded on a private blockchain (a tamper-proof digital register) instead of a
normal database. Students vote free from their phones; anyone can verify the count.

## The 3 things you need to know

1. **The website** — open it, everything happens there. Start at the **Guide** page:
   it walks you through your first election click-by-click in 5 minutes.
2. **The demo chain** — a small program that must be running on a laptop for votes
   to be recorded. For practice on one laptop you need nothing else. For real voting
   with phones, it must be reachable over the internet (see “Going live” below).
3. **Your logins** — admin login for the website (ask the person who gave you this
   project for the ID/password), plus a MetaMask wallet for approving on-chain
   actions (one-time 5-minute setup, described in the website's Guide flow).

## Running a practice election (same laptop, ~10 minutes)

1. In the project folder, double-click **`start-chain.bat`** and leave the window open.
2. Open a second terminal in the same folder and run:
   `npx hardhat run scripts/deploy.ts --network localhost`
   Copy the `ElectionFactory` address it prints.
3. Open the website → **Admin** → sign in → **⚙️ Chain settings** →
   **Autofill from this laptop** → paste the factory address →
   **Test connection & save** (it should say “deploy unlocked”).
4. Follow the website's **Guide** page from step 3: new election → sample voter file
   (download it from the Guide page) → deploy → vote → verify. Done.

## Going live for real voters (phones on internet)

The chain must be reachable publicly. Two options, easiest first:

- **Classroom demo:** install `cloudflared`, run
  `cloudflared tunnel --url http://127.0.0.1:8545`, copy the `https://…` URL,
  and paste it as the RPC URL in **Chain settings**. No redeploy needed.
  Laptop must stay on during voting.
- **Permanent (recommended):** a free Oracle Cloud “Always Free” virtual machine
  running the files in `network/` (`./init.sh`, then `docker compose up -d`).
  Free forever, always on, free to run. Ask a technical friend for 30 minutes of
  help once — after that you never touch it.

## If something goes wrong

| Symptom | Fix |
|---|---|
| “Deploy locked” in the wizard | Admin → Chain settings → check RPC reachable → save again |
| Chain settings test says “Unreachable” | The chain laptop is asleep/off, or the tunnel URL changed — restart it, paste the new URL |
| MetaMask says “wrong network” | Add a custom network with the RPC URL + chain ID shown in Chain settings |
| Forgot admin password | It is set in Vercel → project → Environment Variables (`NEXT_PUBLIC_ADMIN_ID` / `NEXT_PUBLIC_ADMIN_PASS`), then redeploy |
| Votes page says election not active | Admin → open the election → press Start |

## What NOT to do

- Don't edit the voter spreadsheet headers beyond recognition — the upload page lets
  you map columns, but keeping `Roll No, Name, Department, Year, Section` is easiest.
- Don't lose the census `.json` file downloaded at deploy — it is the voter roll
  the site serves. Keep a copy.
- This system fits college/club/society elections. It is not certified for
  government elections — the code README states the limits honestly; show that
  page proudly in any viva or review.
