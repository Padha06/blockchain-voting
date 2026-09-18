// Admin gate — client-side ONLY (no backend in v1).
// Security model, stated plainly:
// - This keeps casual visitors out of the admin UI. It does NOT stop anyone
//   with devtools: the check runs in the browser.
// - Real enforcement is on-chain: only the election owner's wallet can call
//   admin functions (OwnableUpgradeable). Once the app-chain is live the login
//   page upgrades to wallet-signature auth and this password becomes a second layer.
// Single module owning the admin session (sessionStorage, cleared on tab close).
// Nothing else may touch the session key.

const SESSION_KEY = "bv.admin.session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const DEFAULT_ID = "admin";
const DEFAULT_PASS = "admin123"; // demo only — override via env, see .env.example

function expectedId(): string {
  return process.env.NEXT_PUBLIC_ADMIN_ID || DEFAULT_ID;
}

function expectedPass(): string {
  return process.env.NEXT_PUBLIC_ADMIN_PASS || DEFAULT_PASS;
}

export function usingDefaultCredentials(): boolean {
  return !process.env.NEXT_PUBLIC_ADMIN_ID || !process.env.NEXT_PUBLIC_ADMIN_PASS;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface AdminSession {
  id: string;
  issuedAt: number;
}

/** Verify credentials. Passwords are compared as SHA-256 hashes, never stored raw. */
export async function loginAdmin(id: string, password: string): Promise<boolean> {
  const idOk = id.trim() === expectedId();
  const [a, b] = await Promise.all([sha256Hex(password), sha256Hex(expectedPass())]);
  if (!idOk || a !== b) return false;
  const session: AdminSession = { id: id.trim(), issuedAt: Date.now() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return true;
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Valid session present and unexpired? */
export function isAdminLoggedIn(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw) as AdminSession;
    if (typeof s.issuedAt !== "number" || Date.now() - s.issuedAt > SESSION_TTL_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
