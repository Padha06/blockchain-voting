"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { buildTree, guessFieldSafe, randomSalt } from "./wizard-lib";
import { parseWorkbook, type ParseResult } from "@/lib/spreadsheet";
import { storage, type Census, type ElectionDraft } from "@/lib/storage";
import { FACTORY_ADDRESS } from "@/lib/contracts";

const STEPS = ["Details", "Candidates", "Upload roll", "Preview", "Review & deploy"];
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 20260);
const FIELDS = ["rollNo", "name", "department", "year", "section", "ignore"] as const;

interface CandidateDraft {
  name: string;
  tagline: string;
  imageUrl: string;
}

function newDraftId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `draft-${Date.now()}`;
}

export default function NewElection() {
  const [step, setStep] = useState(0);
  const [draftId] = useState(newDraftId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [candidates, setCandidates] = useState<CandidateDraft[]>([{ name: "", tagline: "", imageUrl: "" }]);
  const [salt, setSalt] = useState<`0x${string}`>(() => randomSalt());

  // Upload state
  const [rawBuf, setRawBuf] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [result, setResult] = useState<ParseResult | null>(null);

  // Restore in-progress draft once
  useEffect(() => {
    storage.getDraft("wizard-current").then((d) => {
      if (!d) return;
      setTitle(d.title);
      setDescription(d.description);
      if (d.candidates.length > 0) setCandidates(d.candidates);
    }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft (debounced by step navigation + edits)
  useEffect(() => {
    const draft: ElectionDraft = {
      id: draftId,
      title,
      description,
      candidates,
      voters: result?.voters ?? [],
      createdAt: Date.now(),
    };
    storage.saveDraft("wizard-current", draft).catch(() => undefined);
  }, [draftId, title, description, candidates, result]);

  const previewRoot = useMemo(() => {
    const voters = result?.voters ?? [];
    if (voters.length === 0) return null;
    try {
      const tree = buildTree(voters, salt, "0x0000000000000000000000000000000000000000", CHAIN_ID);
      return tree.root as string;
    } catch {
      return null;
    }
  }, [result, salt]);

  const detailsValid = title.trim().length >= 4;
  const activeCandidates = candidates.filter((c) => c.name.trim().length > 0);
  const candidatesValid = activeCandidates.length >= 2;
  const rollValid = result !== null && result.errors === 0 && result.valid > 0;
  const factoryReady = FACTORY_ADDRESS !== "0x0000000000000000000000000000000000000000";

  async function onFile(file: File) {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    setRawBuf(buf);
    const wb = XLSX.read(buf, { type: "array" });
    const firstSheet = wb.SheetNames[0];
    const ws = firstSheet ? wb.Sheets[firstSheet] : undefined;
    const rows: unknown[][] = ws ? XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) : [];
    const head = (rows[0] ?? []).map((h) => String(h));
    setHeaders(head);
    const auto: Record<number, string> = Object.fromEntries(head.map((h, i) => [i, guessFieldSafe(h)]));
    setMapping(auto);
    setResult(parseWorkbook(buf, auto));
  }

  function remap(col: number, field: string) {
    const next = { ...mapping, [col]: field };
    setMapping(next);
    if (rawBuf) setResult(parseWorkbook(rawBuf, next));
  }

  function download(filename: string, text: string, mime = "application/json") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadErrors() {
    if (!result) return;
    const lines = ["row,field,message,level", ...result.issues.map((i) => `${i.row},${i.field},"${i.message}",${i.level}`)];
    download("voter-errors.csv", lines.join("\n"), "text/csv");
  }

  function downloadCensusDraft() {
    const census: Census = {
      electionAddress: "PENDING_DEPLOY",
      merkleRoot: (previewRoot ?? "0x") as `0x${string}`,
      salt,
      chainId: CHAIN_ID,
      voters: result?.voters ?? [],
      createdAt: Date.now(),
    };
    download("census-draft.json", JSON.stringify(census, null, 2));
  }

  function canContinue() {
    if (step === 0) return detailsValid;
    if (step === 1) return candidatesValid;
    if (step === 2) return result !== null;
    if (step === 3) return rollValid;
    return false;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">New election</h1>
      <ol className="mt-6 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              i === step
                ? "border-indigo-400/50 bg-indigo-500/20 text-white"
                : i < step
                  ? "border-emerald-400/40 text-emerald-300"
                  : "border-white/10 text-gray-400"
            }`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      {/* STEP 0 — details */}
      {step === 0 && (
        <div className="card mt-6">
          <label className="text-sm font-semibold text-gray-300">Election title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. College Election 2026 — Class Representative"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-indigo-400 focus:outline-none"
          />
          {!detailsValid && <p className="mt-1 text-xs text-amber-300">Give it a title of at least 4 characters.</p>}
          <label className="mt-4 block text-sm font-semibold text-gray-300">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this election for? Who can vote?"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-indigo-400 focus:outline-none"
          />
        </div>
      )}

      {/* STEP 1 — candidates */}
      {step === 1 && (
        <div className="card mt-6">
          <div className="grid gap-3">
            {candidates.map((c, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-white/10 bg-black/30 p-3 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={c.name}
                  onChange={(e) => setCandidates(candidates.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  placeholder={`Candidate ${i + 1} name`}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-gray-600 focus:border-indigo-400 focus:outline-none"
                />
                <input
                  value={c.tagline}
                  onChange={(e) => setCandidates(candidates.map((x, j) => (j === i ? { ...x, tagline: e.target.value } : x)))}
                  placeholder="Tagline / party / slogan"
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white placeholder:text-gray-600 focus:border-indigo-400 focus:outline-none"
                />
                <button
                  onClick={() => setCandidates(candidates.filter((_, j) => j !== i))}
                  disabled={candidates.length <= 1}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-400 hover:border-red-400/50 hover:text-red-300 disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setCandidates([...candidates, { name: "", tagline: "", imageUrl: "" }])}
            className="btn-ghost mt-3 !px-4 !py-2 text-sm"
          >
            + Add candidate
          </button>
          {!candidatesValid && (
            <p className="mt-2 text-xs text-amber-300">At least 2 candidates with names — the contract refuses to start with fewer.</p>
          )}
        </div>
      )}

      {/* STEP 2 — upload */}
      {step === 2 && (
        <div className="card mt-6">
          <label className="block rounded-2xl border border-dashed border-white/20 bg-black/30 p-8 text-center transition hover:border-indigo-400/60">
            <div className="text-4xl">📤</div>
            <p className="mt-2 text-sm text-gray-200">{fileName || "Drop the class spreadsheet here, or click to browse"}</p>
            <p className="text-xs text-gray-500">.xlsx · .xls · .csv — parsed entirely in your browser, never uploaded</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </label>
          {headers.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-300">Map columns → voter fields</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <span className="flex-1 truncate font-mono text-xs text-gray-400">{h || `(column ${i + 1})`}</span>
                    <select
                      value={mapping[i] ?? "ignore"}
                      onChange={(e) => remap(i, e.target.value)}
                      className="rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-sm text-white"
                    >
                      {FIELDS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — preview */}
      {step === 3 && (
        <div className="card mt-6">
          {!result ? (
            <p className="text-sm text-gray-400">Go back and upload a spreadsheet first.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm">
                <span className="font-semibold text-emerald-300">{result.valid} valid</span>
                <span className={result.errors > 0 ? "font-semibold text-red-300" : "text-gray-500"}>
                  {result.errors} errors
                </span>
                <span className="text-gray-500">{result.warnings} warnings</span>
                <button onClick={downloadErrors} className="ml-auto text-xs text-indigo-300 hover:text-indigo-200">
                  Download error report (CSV)
                </button>
              </div>
              {result.errors > 0 && (
                <p className="mt-2 text-xs text-red-300">Fix the spreadsheet and re-upload — “Continue” stays locked while hard errors exist.</p>
              )}
              <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-gray-900 text-gray-400">
                    <tr><th className="px-3 py-2">Roll no</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Dept</th><th className="px-3 py-2">Year</th></tr>
                  </thead>
                  <tbody>
                    {result.voters.slice(0, 100).map((v) => (
                      <tr key={v.rollNo} className="border-t border-white/5 text-gray-300">
                        <td className="px-3 py-1.5 font-mono">{v.rollNo}</td>
                        <td className="px-3 py-1.5">{v.name || "—"}</td>
                        <td className="px-3 py-1.5">{v.department || "—"}</td>
                        <td className="px-3 py-1.5">{v.year || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.voters.length > 100 && (
                  <p className="px-3 py-2 text-xs text-gray-500">Showing 100 of {result.voters.length} — full list ships in the census file.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 4 — review & deploy */}
      {step === 4 && (
        <div className="card mt-6">
          <h3 className="font-bold text-white">{title || "Untitled election"}</h3>
          <p className="mt-1 text-sm text-gray-400">{description || "No description."}</p>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div className="kpi"><div className="text-xs uppercase tracking-wider text-gray-400">Candidates</div><div className="text-xl font-bold text-white">{activeCandidates.length}</div></div>
            <div className="kpi"><div className="text-xs uppercase tracking-wider text-gray-400">Voters</div><div className="text-xl font-bold text-white">{result?.valid ?? 0}</div></div>
            <div className="kpi"><div className="text-xs uppercase tracking-wider text-gray-400">Chain</div><div className="text-xl font-bold text-white">{CHAIN_ID}</div></div>
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wider text-gray-400">Merkle root (preview)</span>
              <button onClick={() => setSalt(randomSalt())} className="text-xs text-indigo-300 hover:text-indigo-200">↻ new salt</button>
            </div>
            <p className="mt-1 break-all font-mono text-xs text-emerald-300">{previewRoot ?? "—"}</p>
            <p className="mt-1 text-[11px] text-gray-500">Preview binds a placeholder address — the final root rebinds to the deployed election address at deploy time.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={downloadCensusDraft} disabled={!rollValid} className="btn-ghost !px-4 !py-2 text-sm disabled:opacity-40">
              Download census draft (JSON)
            </button>
            <button
              disabled={!factoryReady || !rollValid || !candidatesValid}
              title={factoryReady ? "Deploy via ElectionFactory" : "Needs NEXT_PUBLIC_FACTORY_ADDRESS — set once the app-chain is live"}
              className="btn-primary !px-4 !py-2 text-sm disabled:opacity-40"
            >
              🚀 Deploy on-chain
            </button>
          </div>
          {!factoryReady && (
            <p className="mt-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              On-chain deploy unlocks once the app-chain is live and <code>NEXT_PUBLIC_FACTORY_ADDRESS</code> is set.
              Until then your draft autosaves locally and the census downloads as a file.
            </p>
          )}
        </div>
      )}

      {/* nav */}
      <div className="mt-6 flex justify-between gap-3">
        <div className="flex gap-3">
          <a href="/admin" className="btn-ghost">Cancel</a>
          {step > 0 && <button onClick={() => setStep(step - 1)} className="btn-ghost">← Back</button>}
        </div>
        {step < STEPS.length - 1 && (
          <button onClick={() => canContinue() && setStep(step + 1)} disabled={!canContinue()} className="btn-primary disabled:opacity-40">
            Continue →
          </button>
        )}
      </div>
    </main>
  );
}
