"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Car,
  Plus,
  Users,
  MessageSquare,
  ClipboardList,
  LogOut,
  ChevronRight,
  ExternalLink,
  Settings,
  Search,
  Menu,
  X,
  Star,
  BarChart2,
  Calculator,
  TrendingUp,
  Shield,
  Database,
  MessageCircle,
  Bookmark,
  UserCheck,
  Film,
} from "lucide-react";
import { clsx } from "clsx";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import NotificationsBell from "@/components/NotificationsBell";
import { SUPER_ADMIN_EMAIL } from "@/lib/super-admin";

const allLinks = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/cars", label: "Inventory", Icon: Car },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/leads", label: "Leads", Icon: MessageSquare },
  { href: "/admin/my-leads", label: "My Leads", Icon: UserCheck },
  { href: "/admin/growth", label: "Growth", Icon: TrendingUp },
  { href: "/admin/buyer-requests", label: "Buyer requests", Icon: ClipboardList },
  { href: "/admin/traffic", label: "Traffic", Icon: BarChart2 },
  { href: "/admin/duty-vehicles", label: "Duty CRSP", Icon: Calculator },
  { href: "/admin/model-specs", label: "Model Specs", Icon: Database },
  { href: "/admin/reviews", label: "Reviews", Icon: Star },
  { href: "/admin/super", label: "Super Admin", Icon: Shield },
  { href: "/admin/watchlist", label: "Watchlist", Icon: Bookmark },
  { href: "/admin/whatsapp-bot", label: "WhatsApp Bot", Icon: MessageCircle },
  { href: "/admin/content-creator", label: "Content Creator", Icon: Film },
];

const quickActions = [
  { href: "/admin/cars/new", label: "Add car", Icon: Plus },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

function NavLink({ href, label, Icon, active, isActive }) {
  const act = isActive !== undefined ? isActive : active;
  return (
    <Link
      href={href}
      className={clsx(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        act
          ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-100 ring-1 ring-inset ring-emerald-500/25"
          : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white"
      )}
    >
      {act && (
        <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
      )}
      <span
        className={clsx(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
          act
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-zinc-800/80 text-zinc-500 group-hover:text-zinc-300"
        )}
      >
        <Icon size={16} strokeWidth={act ? 2.25 : 1.9} />
      </span>
      <span className={act ? "text-emerald-50" : undefined}>{label}</span>
    </Link>
  );
}

function pageTitle(path, sp) {
  if (path === "/admin/leads" && sp?.get("mine") === "1") return "My Leads";
  return (
    allLinks.find((l) => (l.href === "/admin" ? path === l.href : path.startsWith(l.href)))
      ?.label || "Overview"
  );
}

export default function AdminLayout({ children }) {
  const path = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setUserEmail(data.email);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL;

  const links = isSuperAdmin
    ? allLinks
    : allLinks.filter((l) => l.href !== "/admin/super");

  const initials = userEmail
    ? userEmail
        .split("@")[0]
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  useEffect(() => {
    setSidebarOpen(false);
  }, [path]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleGlobalSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      window.location.href = `/admin/cars?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="dark flex min-h-screen bg-[#0e0e0e] text-slate-100 selection:bg-emerald-500/20">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      ) : null}

      <aside
        data-admin-sidebar
        className={clsx(
          "flex w-[264px] shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950",
          "max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:z-50 max-lg:h-[100dvh] max-lg:shadow-xl max-lg:transition-transform max-lg:duration-300",
          sidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
          "lg:sticky lg:top-0 lg:z-auto lg:h-[100dvh] lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 px-4 py-4">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 ring-1 ring-inset ring-zinc-700/60">
              <img
                src="/headerlogo.png"
                alt="BIDGARI"
                className="h-6 w-6 rounded-md object-contain brightness-200 invert"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-white">BIDGARI</p>
              <p className="text-[11px] font-medium text-zinc-400">Admin console</p>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 custom-scrollbar">
          <div>
            <p className="mb-2 flex items-center gap-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              <span className="h-px w-3 bg-zinc-700" />
              Operations
            </p>
            <div className="space-y-0.5">
              {links.map(({ href, label, Icon }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  isActive={
                    href === "/admin"
                      ? path === href
                      : href === "/admin/my-leads"
                        ? path === "/admin/leads" && searchParams.get("mine") === "1"
                        : path.startsWith(href)
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              <span className="h-px w-3 bg-zinc-700" />
              Quick actions
            </p>
            <div className="space-y-0.5">
              {quickActions.map(({ href, label, Icon }) => (
                <NavLink key={href} href={href} label={label} Icon={Icon} active={path.startsWith(href)} />
              ))}
            </div>
          </div>
        </nav>

        <div className="space-y-1 border-t border-zinc-800/80 p-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/70 hover:text-white"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-500">
              <ExternalLink size={15} />
            </span>
            View site
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-rose-950/40 hover:text-rose-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-500">
                <LogOut size={15} />
              </span>
              Log out
            </button>
          </form>
        </div>
      </aside>

      <main className="relative flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Ambient top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(16,185,129,0.05),transparent)]" />

        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-950/85 px-4 py-2.5 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="hidden items-center gap-2 text-xs font-medium text-zinc-500 sm:flex">
              <span>Admin</span>
              <ChevronRight size={12} className="text-zinc-700" />
            </div>
            <h1 className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
              {pageTitle(path, searchParams)}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="relative hidden lg:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search inventory…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleGlobalSearch}
                className="h-10 w-56 rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/50 focus:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/15 xl:w-64"
              />
            </div>

            <div className="flex items-center gap-1 border-l border-zinc-800 pl-2 sm:gap-2 sm:pl-3">
              <NotificationsBell variant="admin" />
              <Link
                href="/admin/settings"
                className="hidden rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 sm:inline-flex"
                title="Settings"
              >
                <Settings size={18} />
              </Link>
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2 py-1.5 lg:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-[10px] font-bold text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]">
                {initials}
              </div>
              <div className="pr-1">
                <p className="text-xs font-semibold text-white">
                  {isSuperAdmin ? "Super Admin" : "Admin"}
                </p>
                <p className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  {loading ? "…" : "Verified"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-scope relative mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
