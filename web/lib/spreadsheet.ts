import * as XLSX from "xlsx";
import { normaliseRollNo } from "./census";
import type { VoterRecord } from "./storage/adapter";

export interface RowIssue {
  row: number;
  field: string;
  message: string;
  level: "error" | "warning";
}

export interface ParseResult {
  voters: VoterRecord[];
  issues: RowIssue[];
  valid: number;
  errors: number;
  warnings: number;
}

const HEADER_GUESS: Record<string, string[]> = {
  rollNo: ["roll", "rollno", "roll no", "regno", "registration", "studentid", "student id", "id"],
  name: ["name", "fullname", "studentname", "student name"],
  department: ["dept", "department", "branch"],
  year: ["year", "yr"],
  section: ["section", "sec"],
};

export function guessField(header: string): string {
  const h = header.trim().toLowerCase();
  for (const [field, keys] of Object.entries(HEADER_GUESS)) {
    if (keys.some((k) => h === k || h.includes(k))) return field;
  }
  return "ignore";
}

/** Parse .xlsx/.xls/.csv in-browser. mapping: columnIndex -> voter field. */
export function parseWorkbook(buf: ArrayBuffer, mapping?: Record<number, string>): ParseResult {
  const wb = XLSX.read(buf, { type: "array" });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) return { voters: [], issues: [], valid: 0, errors: 0, warnings: 0 };
  const ws = wb.Sheets[firstSheet];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (rows.length === 0) return { voters: [], issues: [], valid: 0, errors: 0, warnings: 0 };

  const firstRow = rows[0];
  if (!firstRow) return { voters: [], issues: [], valid: 0, errors: 0, warnings: 0 };
  const header = firstRow.map((h) => String(h));
  const map: Record<number, string> =
    mapping ?? Object.fromEntries(header.map((h, i) => [i, guessField(h)]));
  const hasHeader = Object.values(map).some((f) => f !== "ignore");
  const start = hasHeader ? 1 : 0;

  if (rows.length - start > 20000) {
    return {
      voters: [],
      issues: [{ row: 0, field: "file", message: "Over 20,000 rows: use a database-backed build.", level: "error" }],
      valid: 0, errors: 1, warnings: 0,
    };
  }

  const voters: VoterRecord[] = [];
  const issues: RowIssue[] = [];
  const seen = new Map<string, number>();

  for (let r = start; r < rows.length; r++) {
    const cells = rows[r] as unknown[];
    const get = (field: string): string => {
      const idx = Object.entries(map).find(([, f]) => f === field)?.[0];
      return idx === undefined ? "" : String(cells[Number(idx)] ?? "").trim();
    };
    const rollRaw = get("rollNo");
    const name = get("name");
    const excelRow = r + 1;
    if (!rollRaw) {
      issues.push({ row: excelRow, field: "rollNo", message: "Empty roll number.", level: "error" });
      continue;
    }
    const rollNo = normaliseRollNo(rollRaw);
    if (seen.has(rollNo)) {
      issues.push({ row: excelRow, field: "rollNo", message: `Duplicate of row ${seen.get(rollNo)}.`, level: "error" });
      continue;
    }
    seen.set(rollNo, excelRow);
    if (!name) issues.push({ row: excelRow, field: "name", message: "Empty name (allowed).", level: "warning" });
    voters.push({ rollNo, name, department: get("department") || undefined, year: get("year") || undefined, section: get("section") || undefined });
  }

  const errors = issues.filter((i) => i.level === "error").length;
  return { voters, issues, valid: voters.length, errors, warnings: issues.length - errors };
}
