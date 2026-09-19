"use client";

export default function AdminList() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Elections</h1>
          <p className="mt-1 text-sm text-gray-400">Create, start, stop and audit every vote — all from here.</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/settings" className="btn-ghost">⚙️ Chain settings</a>
          <a href="/admin/new" className="btn-primary">+ New election</a>
        </div>
      </div>
      <div className="card mt-8 text-center">
        <div className="text-4xl">🗳️</div>
        <h2 className="mt-3 font-bold text-white">No elections yet</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-400">
          Run the creation wizard: details → candidates → spreadsheet upload → preview → deploy.
        </p>
        <a href="/admin/new" className="btn-ghost mt-5">Start the wizard</a>
      </div>
    </main>
  );
}
