// Re-exports for the wizard so page.tsx stays readable.
// Rule: all Merkle logic still flows through lib/census.ts — no duplication.
export { buildTree, randomSalt, normaliseRollNo } from "@/lib/census";
export { guessField as guessFieldSafe } from "@/lib/spreadsheet";
