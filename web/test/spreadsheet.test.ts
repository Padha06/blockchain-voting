import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseWorkbook } from "../lib/spreadsheet";

function buf(rows: unknown[][]): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "S");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

describe("spreadsheet", () => {
  it("detects duplicates after normalisation", () => {
    const r = parseWorkbook(buf([["roll no", "name"], ["cs001", "A"], [" CS001 ", "B"], ["", "C"]]));
    expect(r.errors).toBe(2);
    expect(r.valid).toBe(1);
  });
});
