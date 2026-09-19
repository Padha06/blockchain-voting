@echo off
REM Zero-gas demo chain for classroom use. Keep this window open.
REM Admin wallet: import hardhat account #0 into MetaMask (key in README).
cd /d "%~dp0"
npx hardhat node --port 8545
