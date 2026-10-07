"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CompareBar } from "@/components/CompareSelector";
import { ModalProvider } from "@/components/Modal";
import GlobalFooter from "@/components/GlobalFooter";
import { useClientSession } from "@/hooks/use-client-session";
import { setAdminMode } from "@/hooks/use-admin-mode";
import AdminModePill from "@/components/AdminModePill";

/**
 * Public marketing pages get the global nav, compare bar, and footer.
 * Admin and dealer portal use their own full-height shells so fixed chrome
 * does not overlap sidebars/headers.
 *
 * Auth state is fetched client-side (`/api/auth/me`) so the root layout stays
 * free of cookies()/headers() — which would disable ISR/HTML caching.
 */
export default function SiteChrome({ children, navCounts }) {
  const { user } = useClientSession();
  const pathname = usePathname() || "/";

  // Flip the global admin-mode flag once the session resolves, so public pages
  // can render admin affordances without every card firing /api/auth/me.
  useEffect(() => {
    setAdminMode(Boolean(user?.role === "ADMIN"));
  }, [user?.role]);
  const appShell =
    pathname.startsWith("/admin") ||
    pathname === "/maintenance";

  const hideFooter = pathname.startsWith("/cars");

  if (appShell) {
    return (
      <ModalProvider>
        <main className="flex-1 min-h-0">{children}</main>
      </ModalProvider>
    );
  }

  return (
    <>
      <Navbar user={user} navCounts={navCounts} />
      <ModalProvider>
        <main className="flex-1">{children}</main>
        <CompareBar />
      </ModalProvider>
      <AdminModePill />
      {!hideFooter && <GlobalFooter />}
    </>
  );
}
