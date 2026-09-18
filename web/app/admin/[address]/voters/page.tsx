"use client";

export default function Voters() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-extrabold text-white">Voters</h1>
      <p className="mt-1 text-sm text-gray-400">Upload .xlsx / .xls / .csv, map columns, preview errors, then build the census.</p>
      <div className="card mt-6 border-dashed text-center">
        <div className="text-4xl">📤</div>
        <p className="mt-2 text-sm text-gray-300">Drop your spreadsheet here</p>
        <p className="text-xs text-gray-500">4,812 valid · 3 errors · 11 warnings — preview before commit</p>
      </div>
    </main>
  );
}
