"use client";

export default function Results({ params }: { params: { address: string } }) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10 text-center">
      <h1 className="text-3xl font-extrabold text-white">Results</h1>
      <p className="mt-1 font-mono text-xs text-gray-500">{params.address}</p>
      <div className="card mt-6 text-sm text-gray-400">
        Published once the election ends. Every figure links back to on-chain events.
      </div>
    </main>
  );
}
