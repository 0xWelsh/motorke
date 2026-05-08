"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Plus, 
  MessageSquare, 
  BarChart2, 
  Package, 
  CreditCard, 
  Settings, 
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Search,
  LifeBuoy,
  CircleHelp
} from "lucide-react";
import { clsx } from "clsx";
import { useState, useEffect, useRef } from "react";
import NotificationsBell from "@/components/NotificationsBell";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/portal", label: "Overview", Icon: LayoutDashboard },
  { href: "/portal/inventory", label: "Inventory", Icon: Package },
  { href: "/portal/leads", label: "Leads", Icon: MessageSquare, badge: "New" },
  { href: "/portal/analytics", label: "Analytics", Icon: BarChart2 },
  { href: "/portal/subscription", label: "Plans", Icon: CreditCard },
  { href: "/portal/profile", label: "Settings", Icon: Settings },
];

function isNavActive(currentPath, href) {
  if (href === "/portal") {
    return currentPath === "/portal" || currentPath === "/portal/";
  }
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function NavLink({ href, label, Icon, badge, active, onClick }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all",
        active 
          ? "bg-[#111111] text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]" 
          : "text-slate-700 hover:text-slate-900 dark:text-white hover:bg-[#fbfcfe] dark:bg-[#111111]"
      )}
    >
      <Icon size={18} />
      <span className="font-semibold text-[11px] uppercase font-black tracking-[0.10em]">{label}</span>
      {badge ? (
        <span className={clsx(
          "ml-auto inline-flex items-center px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]",
          active ? "bg-white/15 text-white" : "bg-emerald-100 text-emerald-700"
        )}>
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

/** Compact link for persistent desktop header (lg+ ; mobile uses bottom tabs + drawer) */
function HeaderNavLink({ href, label, Icon, pathname }) {
  const active = isNavActive(pathname, href);
  return (
    <Link
      href={href}
      className={clsx(
        "hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] transition-colors whitespace-nowrap",
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
      )}
    >
      <Icon size={14} />
      {label}
    </Link>
  );
}

export default function PortalLayout({ children }) {
  const path = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const headerSearchRef = useRef(null);
  const drawerSearchRef = useRef(null);

  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleNavClick = () => {
    setDrawerOpen(false);
  };

  const runPortalSearch = (raw) => {
    const query = String(raw || "").trim();
    if (!query) return;
    const lower = query.toLowerCase();
    const clean = query.replace(/^(leads?|inventory|orders?)\s*[:\-]?\s*/i, "").trim();
    const commandMatches = [...query.matchAll(/([a-zA-Z_]+):(".*?"|\S+)/g)];
    const commands = Object.fromEntries(
      commandMatches.map(([, key, value]) => [key.toLowerCase(), value.replace(/^"|"$/g, "")])
    );

    if (lower.includes("plan") || lower.includes("subscription")) {
      router.push("/portal/subscription");
      setDrawerOpen(false);
      return;
    }
    if (lower.includes("analytic") || lower.includes("performance") || lower.includes("views")) {
      router.push("/portal/analytics");
      setDrawerOpen(false);
      return;
    }
    if (lower.includes("order") || lower.includes("sold")) {
      const soldQuery = clean || query;
      const params = new URLSearchParams({ status: "SOLD" });
      if (soldQuery && !/^sold|orders?$/i.test(soldQuery)) params.set("search", soldQuery);
      router.push(`/portal/leads?${params.toString()}`);
      setDrawerOpen(false);
      return;
    }
    if (lower.includes("lead") || lower.includes("enquir")) {
      const params = new URLSearchParams();
      if (clean) params.set("search", clean);
      router.push(`/portal/leads${params.toString() ? `?${params.toString()}` : ""}`);
      setDrawerOpen(false);
      return;
    }
    if (
      commands.make ||
      commands.brand ||
      commands.body ||
      commands.shape ||
      commands.fuel ||
      commands.trans ||
      commands.gear ||
      commands.min ||
      commands.max ||
      commands.year ||
      commands.filter ||
      commands.status
    ) {
      const params = new URLSearchParams();
      if (commands.make || commands.brand) params.set("make", commands.make || commands.brand);
      if (commands.body || commands.shape) params.set("bodyType", (commands.body || commands.shape || "").toUpperCase());
      if (commands.fuel) params.set("fuelType", commands.fuel.toUpperCase());
      if (commands.trans || commands.gear) params.set("transmission", (commands.trans || commands.gear || "").toUpperCase());
      if (commands.min) params.set("minPrice", commands.min.replace(/[^\d]/g, ""));
      if (commands.max) params.set("maxPrice", commands.max.replace(/[^\d]/g, ""));
      if (commands.year) {
        const year = commands.year.replace(/[^\d]/g, "");
        if (year.length >= 4) {
          params.set("minYear", year);
          params.set("maxYear", year);
        }
      }
      if (commands.filter || commands.status) {
        const mode = (commands.filter || commands.status || "").toLowerCase();
        params.set("filter", mode === "live" ? "live" : mode === "sold" || mode === "draft" ? "sold" : "all");
      }
      if (!params.get("filter")) params.set("filter", "all");
      router.push(`/portal/inventory?${params.toString()}`);
      setDrawerOpen(false);
      return;
    }
    const invParams = new URLSearchParams();
    invParams.set("search", query);
    router.push(`/portal/inventory?${invParams.toString()}`);
    setDrawerOpen(false);
  };

  const onHeaderSearchSubmit = (event) => {
    event.preventDefault();
    runPortalSearch(quickQuery);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "/") return;
      const targetTag = event.target?.tagName?.toLowerCase();
      const isTypingTarget =
        targetTag === "input" ||
        targetTag === "textarea" ||
        event.target?.isContentEditable;
      if (isTypingTarget) return;
      event.preventDefault();
      const targetInput = drawerOpen ? drawerSearchRef.current : headerSearchRef.current || drawerSearchRef.current;
      if (targetInput) targetInput.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      
      {/* Backdrop Overlay */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 bg-[#111111]/50 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#ddd4c8] dark:border-slate-800 px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
         <div className="flex items-center gap-3">
           <button 
             onClick={() => setDrawerOpen(!drawerOpen)}
             className="inline-flex items-center gap-2 px-3 py-2 border border-[#2F855A] bg-[#38A169] text-white hover:bg-[#2F855A] transition-colors shadow-sm"
             style={{ borderRadius: "10px" }}
             aria-label="Open navigation menu"
           >
             <Menu size={18} />
             <span className="text-[11px] font-bold uppercase tracking-widest">Menu</span>
           </button>
           <div className="hidden lg:flex flex-col min-w-0">
              <span className="text-[11px] uppercase font-black tracking-[0.10em] font-bold text-slate-900 dark:text-white">Welsh Motorhub</span>
              <p className="text-[11px] uppercase font-black tracking-[0.15em] font-semibold text-[#ff5a2f] mt-0.5 flex items-center gap-1">
                 <ShieldCheck size={11} /> Active Subscription
              </p>
           </div>

           {/* Desktop: always-visible primary nav (drawer stays for full list + bulk actions) */}
           <nav className="hidden lg:flex items-center gap-1 ml-4 pl-4 border-l border-[#ddd4c8] dark:border-slate-700 overflow-x-auto max-w-[min(52vw,640px)]" aria-label="Portal sections">
             <HeaderNavLink href="/portal" label="Overview" Icon={LayoutDashboard} pathname={path} />
             <HeaderNavLink href="/portal/inventory" label="Inventory" Icon={Package} pathname={path} />
             <HeaderNavLink href="/portal/leads" label="Leads" Icon={MessageSquare} pathname={path} />
             <HeaderNavLink href="/portal/analytics" label="Analytics" Icon={BarChart2} pathname={path} />
             <HeaderNavLink href="/portal/profile" label="Settings" Icon={Settings} pathname={path} />
           </nav>
         </div>
         
         <div className="hidden xl:flex items-center w-full max-w-md gap-2">
            <form onSubmit={onHeaderSearchSubmit} className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={headerSearchRef}
                type="search"
                placeholder="Search vehicles, leads, orders... (press /)"
                value={quickQuery}
                onChange={(event) => setQuickQuery(event.target.value)}
                title="Use commands like make:Toyota body:SUV fuel:PETROL min:1500000 max:4500000 year:2020"
                className="w-full h-10 pl-9 pr-3 border border-[#ddd4c8] bg-white text-[12px] font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#2F855A]"
              />
            </form>
            <details className="group relative">
              <summary className="list-none w-10 h-10 border border-[#ddd4c8] bg-white inline-flex items-center justify-center text-slate-600 cursor-pointer hover:bg-[#fbfcfe]">
                <CircleHelp className="w-4 h-4" />
              </summary>
              <div className="absolute right-0 mt-2 w-72 p-3 border border-[#ddd4c8] bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.04)] z-50">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">Search syntax</p>
                <ul className="mt-2 space-y-1 text-[11px] font-medium text-slate-600">
                  <li><code>lead:john</code> {"->"} lead inbox search</li>
                  <li><code>status:sold</code> {"->"} sold leads</li>
                  <li><code>make:Toyota body:SUV</code></li>
                  <li><code>fuel:PETROL trans:AUTOMATIC</code></li>
                  <li><code>min:1500000 max:4500000 year:2021</code></li>
                </ul>
              </div>
            </details>
         </div>

         <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle simple />
            <Link
              href="/portal/profile"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border border-[#ddd4c8] dark:border-slate-800 bg-white dark:bg-[#111111] text-slate-700 dark:text-white text-[10px] font-black uppercase tracking-[0.12em] hover:bg-[#fbfcfe] dark:hover:bg-[#151515] transition-colors"
              style={{ borderRadius: "10px" }}
            >
              <Settings size={14} /> Account
            </Link>
            <NotificationsBell variant="portal" />
            <div className="w-10 h-10 rounded-2xl bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 text-slate-700 flex items-center justify-center font-bold shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
              D
            </div>
         </div>
      </header>

      {/* Floating Drawer */}
      <aside className={clsx(
        "fixed left-0 top-0 h-screen w-72 bg-white border-r border-[#ddd4c8] dark:border-slate-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)] z-50 flex flex-col transition-transform duration-300",
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Close Button */}
        <div className="p-4 border-b border-[#ddd4c8] dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-black tracking-[0.10em] font-bold text-slate-900 dark:text-white">Navigation</span>
            <button 
              onClick={() => setDrawerOpen(false)}
              className="p-1 text-slate-700 hover:text-slate-900 dark:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-3 border border-[#ddd4c8] bg-[#fbfcfe] px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-[#ddd4c8] text-slate-700 flex items-center justify-center text-[11px] font-black">DP</div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-800">Dealer Portal</p>
                <p className="text-[10px] font-semibold text-[#2F855A] inline-flex items-center gap-1">
                  <ShieldCheck size={11} /> Active dealer
                </p>
              </div>
            </div>
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              runPortalSearch(quickQuery);
            }}
          >
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={drawerSearchRef}
                type="search"
                value={quickQuery}
                onChange={(event) => setQuickQuery(event.target.value)}
                placeholder="Search vehicles, leads..."
                title="Examples: lead:john, make:Toyota body:SUV, status:sold"
                className="w-full h-9 pl-8 pr-2 border border-[#ddd4c8] bg-white text-[11px] font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#2F855A]"
              />
            </div>
            <button
              type="submit"
              className="w-full h-9 inline-flex items-center justify-center gap-2 border border-[#ddd4c8] bg-white text-[10px] font-black uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50"
            >
              <Search size={13} /> Quick search
            </button>
          </form>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {/* OVERVIEW Section */}
          <div className="mb-4">
            <p className="text-[11px] uppercase font-black tracking-[0.15em] font-bold text-slate-700 uppercase tracking-wide px-4 py-2 mb-2">Overview</p>
            <div className="space-y-1">
              {links.slice(0, 3).map(({ href, label, Icon, badge }) => (
                <NavLink 
                  key={href} 
                  href={href} 
                  label={label} 
                  Icon={Icon} 
                  badge={badge}
                  active={isNavActive(path, href)}
                  onClick={handleNavClick}
                />
              ))}
            </div>
          </div>

          {/* MANAGEMENT Section */}
          <div>
            <p className="text-[11px] uppercase font-black tracking-[0.15em] font-bold text-slate-700 uppercase tracking-wide px-4 py-2 mb-2">Management</p>
            <div className="space-y-1">
              {links.slice(3).map(({ href, label, Icon, badge }) => (
                <NavLink 
                  key={href} 
                  href={href} 
                  label={label} 
                  Icon={Icon} 
                  badge={badge}
                  active={isNavActive(path, href)}
                  onClick={handleNavClick}
                />
              ))}
            </div>
          </div>
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#ddd4c8] dark:border-slate-800 space-y-2">
          <Link 
            href="/portal/cars/bulk"
            onClick={handleNavClick}
            className="flex items-center justify-center gap-2 w-full bg-[#fbfcfe] dark:bg-[#111111] hover:bg-slate-200 text-slate-900 dark:text-white font-semibold py-2.5 rounded-2xl transition-all text-[11px] uppercase font-black tracking-[0.15em]"
          >
            <Plus size={14} /> Bulk Upload
          </Link>
          <Link 
            href="/portal/cars/new"
            onClick={handleNavClick}
            className="flex items-center justify-center gap-2 w-full bg-[#111111] hover:bg-[#111111] text-white font-semibold py-2.5 rounded-2xl transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)] text-[11px] uppercase font-black tracking-[0.15em]"
          >
            <Plus size={14} /> Add Car
          </Link>
          
          <div className="pt-2 border-t border-[#ddd4c8] dark:border-slate-800 space-y-1">
            <Link
              href="/portal/profile"
              onClick={handleNavClick}
              className="flex items-center justify-between gap-3 px-4 py-2.5 border border-[#ddd4c8] bg-[#fbfcfe] text-slate-700 text-[10px] uppercase font-black tracking-[0.12em] rounded-2xl hover:bg-slate-100 transition-all"
            >
              <span className="inline-flex items-center gap-2"><LifeBuoy size={14} /> Need help?</span>
              <span className="text-[#2F855A]">Support</span>
            </Link>
            <Link 
              href="/"
              onClick={handleNavClick}
              className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:text-slate-900 dark:text-white text-[11px] uppercase font-black tracking-[0.15em] font-semibold rounded-2xl transition-all"
            >
              <ExternalLink size={14} /> Marketplace
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button 
                type="submit" 
                className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-700 hover:text-rose-600 text-[11px] uppercase font-black tracking-[0.15em] font-semibold rounded-2xl transition-all"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-white pb-20 lg:pb-0">
        <div className="p-4 sm:p-5 lg:p-8 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar — visible below lg */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/98 dark:bg-[#0a0a0a]/98 backdrop-blur-md border-t border-[#ddd4c8] dark:border-slate-800 flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[
          { href: "/portal",           label: "Overview",  Icon: LayoutDashboard },
          { href: "/portal/inventory", label: "Inventory", Icon: Package         },
          { href: "/portal/leads",     label: "Leads",     Icon: MessageSquare   },
          { href: "/portal/profile",   label: "Profile",   Icon: Settings        },
          { href: "/portal/cars/new",  label: "Add Car",   Icon: Plus            },
        ].map(({ href, label, Icon }) => {
          const active = isNavActive(path, href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition-colors",
                active ? "text-[#2F855A]" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}