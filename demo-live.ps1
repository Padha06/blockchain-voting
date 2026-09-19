# One-command live demo: chain + factory + tunnel + Vercel env + redeploy.
# Usage:  powershell -ExecutionPolicy Bypass -File demo-live.ps1
# Requires: Node 20+, Vercel CLI (logged in: `vercel login`), cloudflared.
# Keeps chain + tunnel alive in this window. Ctrl+C tears everything down.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Need($cmd, $hint) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Host "Missing: $cmd — $hint" -ForegroundColor Red
    exit 1
  }
}

Need "npx" "install Node.js 20+"
Need "cloudflared" "https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
Need "vercel" "npm i -g vercel, then vercel login"

# 1. Chain
$chain = Start-Process powershell -ArgumentList "-NoProfile","-Command","npx hardhat node --port 8545" -PassThru -WindowStyle Hidden
Write-Host "Chain starting (pid $($chain.Id))…" -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' http://127.0.0.1:8545
    if ($r.Content -match "0x7a69") { $ready = $true; break }
  } catch { Start-Sleep -Seconds 2 }
}
if (-not $ready) { Write-Host "Chain did not start." -ForegroundColor Red; Stop-Process -Id $chain.Id -Force; exit 1 }
Write-Host "Chain up (31337)." -ForegroundColor Green

try {
  # 2. Factory
  npx hardhat run scripts/deploy.ts --network localhost
  $dep = Get-Content deployment.json | ConvertFrom-Json
  Write-Host "Factory: $($dep.factory)" -ForegroundColor Green

  # 3. Tunnel (quick tunnel — URL changes every run; settings page absorbs that)
  $tunnelLog = Join-Path $env:TEMP "bv-tunnel.log"
  $tunnel = Start-Process cloudflared -ArgumentList "tunnel","--url","http://127.0.0.1:8545","--logfile",$tunnelLog -PassThru -WindowStyle Hidden
  $url = $null
  for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 2
    if (Test-Path $tunnelLog) {
      $m = Select-String -Path $tunnelLog -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | Select-Object -Last 1
      if ($m) { $url = $m.Matches[0].Value; break }
    }
  }
  if (-not $url) { throw "Tunnel URL not found in log." }
  Write-Host "Public RPC: $url" -ForegroundColor Green

  # 4. Vercel env (plain visibility — NEXT_PUBLIC_ cannot be secret)
  Push-Location web
  foreach ($kv in @(
    @("NEXT_PUBLIC_RPC_URL", $url),
    @("NEXT_PUBLIC_CHAIN_ID", "31337"),
    @("NEXT_PUBLIC_FACTORY_ADDRESS", $dep.factory),
    @("NEXT_PUBLIC_EXPLORER_URL", $url)
  )) {
    $name, $value = $kv
    vercel env rm $name production -y 2>$null | Out-Null
    echo $value | vercel env add $name production 2>$null | Out-Null
    Write-Host "  env $name = $value"
  }

  # 5. Redeploy with the new env
  vercel --prod --yes
  Pop-Location

  Write-Host ""
  Write-Host "LIVE. Admin → Chain settings will also show deploy unlocked." -ForegroundColor Green
  Write-Host "Keep this window open for the whole demo. Press Ctrl+C to stop chain + tunnel."
  Wait-Process -Id $chain.Id
}
finally {
  Stop-Process -Id $chain.Id -Force -ErrorAction SilentlyContinue
  Stop-Process -Id $tunnel.Id -Force -ErrorAction SilentlyContinue
}
