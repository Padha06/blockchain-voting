"use client";
export default function Vote({ params }: { params: { address: string } }) {
  return (
    <main style={{ padding: 32 }}>
      <h1>Vote — {params.address}</h1>
      <p>Zero gas on the college app-chain. Enter roll number, confirm name, pick a candidate.</p>
    </main>
  );
}
