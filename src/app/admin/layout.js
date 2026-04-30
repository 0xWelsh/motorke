"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Car, 
  Plus, 
  Building2, 
  Users, 
  MessageSquare, 
  LogOut,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Settings,
  Search,
  UserPlus,
  Menu,
  X,
  Star
} from "lucide-react";
import { clsx } from "clsx";
import { useState, useEffect } from "react";
import NotificationsBell from "@/components/NotificationsBell";

const links = [
  { href: "/admin",           label: "Overview",    Icon: LayoutDashboard },
  { href: "/admin/cars",      label: "Inventory",   Icon: Car             },
  { href: "/admin/dealers",   label: "Dealers",     Icon: Building2       },
  { href: "/admin/approvals", label: "Approvals",   Icon: ShieldAlert     },
  { href: "/admin/users",     label: "Users",       Icon: Users           },
  { href: "/admin/leads",     label: "Leads",       Icon: MessageSquare   },
  { href: "/admin/reviews",   label: "Reviews",     Icon: Star            },
];

const quickActions = [
  { href: "/admin/cars/new",    label: "Add Car",    Icon: Plus },
  { href: "/admin/dealers/new", label: "Add Dealer", Icon: UserPlus },
  { href: "/admin/settings",    label: "Configurations", Icon: Settings },
];

function NavLink({ href, label, Icon, active }) {
  return (
    <Link 
      href={href} 
      className={clsx(
        "flex items-center justify-between group px-4 py-2.5 rounded-xl transition-all duration-200",
        active
          ? "bg-slate-900 border border-slate-800 text-white shadow-sm dark:border-slate-700"
          : "text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111111] border border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900 hover:border-slate-200/80 dark:hover:border-zinc-700"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={17} className={clsx("transition-all", active ? "text-[#4ade80]" : "text-slate-400 group-hover:text-[#2F855A] dark:group-hover:text-[#38A169]")} />
        <span className="text-[11px] font-black uppercase tracking-[0.15em]">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-[#38A169]" />}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  const path = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [path]);

  // Prevent body scroll when sidebar is open on mobile
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
    <div className="flex min-h-screen bg-slate-100/90 dark:bg-[#0b0b0c] text-slate-900 dark:text-slate-100 selection:bg-[#2F855A]/20 selection:text-slate-900 dark:selection:text-white relative">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: desktop = sticky flush-left rail (does not stretch with page height); mobile = layered drawer */}
      <aside className={clsx(
        "flex flex-col shrink-0 z-50 lg:z-auto bg-white dark:bg-zinc-950 border-[#ddd4c8] dark:border-zinc-800 overflow-hidden transition-transform duration-300 ease-out",
        // Mobile drawer
        "max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:h-[100dvh] max-lg:w-[min(290px,88vw)] max-lg:border-r max-lg:rounded-r-2xl max-lg:shadow-[12px_0_40px_rgba(0,0,0,0.12)]",
        sidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
        // Desktop rail — pinned to viewport, constant width (avoids awkward stretch with tall main columns)
        "lg:sticky lg:top-0 lg:self-start lg:h-[100dvh] lg:min-h-0 lg:w-[264px] lg:border-r lg:rounded-none lg:shadow-none"
      )}>
        {/* Branding */}
        <div className="p-5 lg:px-5 lg:py-5 flex items-center justify-between border-b border-slate-200/90 dark:border-zinc-800">
          <Link href="/" className="flex items-center gap-3.5 group min-w-0">
            <div className="w-11 h-11 shrink-0 bg-slate-900 dark:bg-black rounded-xl flex items-center justify-center group-hover:bg-[#2F855A] transition-colors duration-300">
              <img src="/headerlogo.png" alt="Welsh Motorhub" className="w-8 h-8 object-contain rounded-lg filter invert brightness-200" />
            </div>
            <div className="min-w-0">
              <span className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight block leading-tight truncate">
                Welsh <span className="text-[#2F855A] dark:text-[#38A169]">Motorhub</span>
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-0.5 block">
                Admin
              </span>
            </div>
          </Link>
          <button className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Core Operations</p>
          </div>
          {links.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={href === "/admin" ? path === href : path.startsWith(href)} />
          ))}
          
          <div className="px-4 mb-4 mt-8">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Management</p>
          </div>
          {quickActions.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path.startsWith(href)} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/90 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/40">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:text-[#2F855A] dark:text-slate-200 dark:hover:text-[#38A169] text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-slate-200 dark:hover:border-zinc-600">
            <ExternalLink size={14} /> View Site
          </Link>
          <form action="/api/auth/logout" method="POST" className="mt-1">
            <button type="submit" className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:text-rose-600 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-100 dark:hover:border-rose-800 border border-transparent">
              <LogOut size={14} /> Log Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 min-h-screen relative flex flex-col bg-slate-50/50 dark:bg-[#0b0b0c]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 px-4 lg:px-8 py-3 lg:py-3.5 flex items-center justify-between gap-4">
           <div className="flex items-center gap-3 lg:gap-4 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest shrink-0">
              <button 
                type="button"
                className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-[#2F855A] dark:text-slate-400 dark:hover:text-[#38A169] transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
              >
                 <Menu size={20} />
              </button>
              <span className="hidden sm:inline text-slate-400 dark:text-slate-500">Admin</span>
              <ChevronRight size={12} className="hidden sm:block text-slate-300 dark:text-zinc-600" />
              <span className="text-slate-900 dark:text-white font-black truncate max-w-[150px] sm:max-w-none tracking-tight">
                {links.find(l => (l.href === "/admin" ? path === l.href : path.startsWith(l.href)))?.label || "Overview"}
              </span>
           </div>
           
           <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              {/* Search */}
              <div className="hidden lg:flex items-center relative group">
                <Search className="absolute left-4 w-4 h-4 text-slate-400 group-focus-within:text-[#2F855A] dark:group-focus-within:text-[#38A169] transition-colors" />
                <input 
                  type="text"
                  placeholder="Search cars... (Enter)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleGlobalSearch}
                  className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-[13px] font-medium text-slate-900 dark:text-slate-100 w-56 xl:w-64 focus:w-72 xl:focus:w-80 focus:border-[#2F855A]/40 focus:ring-2 focus:ring-[#2F855A]/15 dark:focus:border-[#38A169]/40 dark:focus:ring-[#38A169]/10 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-200 dark:border-zinc-800 pl-3 sm:pl-5 shrink-0">
                  <NotificationsBell variant="admin" />
                 <Link href="/admin/settings" className="hidden sm:flex text-slate-500 hover:text-[#2F855A] dark:text-slate-400 dark:hover:text-[#38A169] transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800" title="Configurations">
                    <Settings size={20} />
                 </Link>
              </div>

              <div className="flex items-center gap-2.5 bg-[#2F855A]/8 dark:bg-[#38A169]/10 border border-[#2F855A]/20 dark:border-[#38A169]/25 p-1.5 lg:pr-3.5 rounded-xl shrink-0">
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-[#2F855A] dark:bg-[#38A169] text-white flex items-center justify-center font-black text-[10px] lg:text-[11px] shadow-sm">
                  AD
                </div>
                <div className="hidden lg:flex flex-col">
                  <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none">Super Admin</p>
                  <p className="text-[9px] font-bold text-[#2F855A] dark:text-[#4ade80] uppercase tracking-widest mt-1">Verified</p>
                </div>
              </div>
           </div>
        </header>

        {/* Mobile subpage switcher (redundant nav so routes are reachable) */}
        <nav className="lg:hidden px-4 pt-2.5 pb-2 overflow-x-auto border-b border-slate-200/90 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2 min-w-max">
            {links.map(({ href, label, Icon }) => {
              const active = href === "/admin" ? path === href : path.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    active
                      ? "inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2F855A]/10 dark:bg-[#38A169]/15 border border-[#2F855A]/25 dark:border-[#38A169]/35 text-[#1e5f3f] dark:text-[#86efac] flex-shrink-0"
                      : "inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#111111] border border-slate-100 dark:border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:border-slate-200 dark:hover:border-zinc-700 flex-shrink-0"
                  }
                >
                  <Icon size={16} className={active ? "text-[#2F855A] dark:text-[#4ade80]" : ""} />
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap">
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="admin-scope p-4 sm:p-5 lg:px-8 lg:py-8 xl:px-10 xl:py-10 w-full overflow-x-auto max-w-[1400px] mx-auto relative z-10 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
