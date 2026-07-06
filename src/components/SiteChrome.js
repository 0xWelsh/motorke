"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import SiteTopBar from "@/components/SiteTopBar";
import { CompareBar } from "@/components/CompareSelector";
import { ModalProvider } from "@/components/Modal";
import GlobalFooter from "@/components/GlobalFooter";

/**
 * Public marketing pages get the global nav, compare bar, and footer.
 * Admin and dealer portal use their own full-height shells so fixed chrome does not overlap sidebars/headers.
 *
 * `shellPath` comes from middleware (`x-pathname`) so the server HTML matches the client (usePathname can be empty on SSR).
 */
export default function SiteChrome({ user, children, shellPath = "/" }) {
  const clientPath = usePathname();
  const pathname = clientPath || shellPath || "/";
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
      <SiteTopBar />
      <Navbar user={user} />
      <ModalProvider>
        <main className="flex-1">{children}</main>
        <CompareBar />
      </ModalProvider>
      {!hideFooter && <GlobalFooter />}
    </>
  );
}
