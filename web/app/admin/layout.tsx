"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAdminLoggedIn, logoutAdmin } from "@/lib/admin-auth";

// Gate for everything under /admin/* except /admin/login itself.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecked(true);
      return;
    }
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (!checked) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16 text-center text-sm text-gray-500">
        Checking admin session…
      </main>
    );
  }

  return (
    <>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> admin session
        </p>
        <button
          onClick={() => {
            logoutAdmin();
            router.replace("/admin/login");
          }}
          className="text-xs text-gray-400 hover:text-white"
        >
          Sign out
        </button>
      </div>
      {children}
    </>
  );
}
