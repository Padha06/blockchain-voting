export default function Home() {
  return (
    <main style={{ padding: 32, fontFamily: "system-ui" }}>
      <h1>Blockchain Voting — College AppChain (zero gas)</h1>
      <p>Votes on-chain · eligibility via Merkle root · identities off-chain.</p>
      <ul>
        <li><a href="/admin">Admin portal</a></li>
        <li><a href="/verify">Verify a receipt</a></li>
      </ul>
    </main>
  );
}
