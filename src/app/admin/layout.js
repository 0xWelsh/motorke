"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Car, 
  Plus, 
  Upload, 
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
  Command,
  Menu,
  X
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
        "flex items-center justify-between group px-5 py-3 rounded-2xl transition-all duration-300",
        active
          ? "bg-[#111111] border border-[#111111] text-white shadow-none"
          : "text-slate-900 dark:text-white bg-white dark:bg-[#111111] border border-transparent hover:bg-[#fbfcfe] dark:bg-[#111111] hover:border-[#ddd4c8] dark:border-slate-800"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={clsx("transition-all", active ? "text-[#ff5a2f]" : "group-hover:text-[#ff5a2f]")} />
        <span className="text-[11px] font-black uppercase tracking-[0.15em]">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-2xl bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
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
    <div className="flex bg-[#fbfcfe] dark:bg-[#111111] text-white selection:bg-[#ff5a2f]/20 selection:text-white relative">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "w-72 bg-white border-r border-[#ddd4c8] dark:border-slate-800 flex flex-col shrink-0 h-screen z-50 fixed transition-transform duration-300 lg:lg:border-r lg:sticky lg:top-0 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Branding */}
        <div className="p-6 lg:p-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-[#111111] rounded-2xl flex items-center justify-center group-hover:bg-[#ff5a2f] transition-all duration-500 shadow-none">
              <img src="/headerlogo.png" alt="Motorke" className="w-8 h-8 object-contain rounded-2xl filter invert brightness-200" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter block leading-none">
                Motor<span className="text-[#ff5a2f]">ke</span>
              </span>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1.5 block">
                Admin Panel
              </span>
            </div>
          </Link>
          <button className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-2xl" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Core Operations</p>
          </div>
          {links.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
          
          <div className="px-4 mb-4 mt-8">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Management</p>
          </div>
          {quickActions.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-slate-900 dark:text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl transition-all hover:bg-white dark:bg-[#111111] border border-transparent hover:border-[#ddd4c8] dark:border-slate-800">
            <ExternalLink size={14} /> View Site
          </Link>
          <form action="/api/auth/logout" method="POST" className="mt-1">
            <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 text-slate-700 hover:text-rose-600 text-[11px] font-bold uppercase tracking-widest rounded-2xl transition-all hover:bg-rose-50 hover:border-rose-100 border border-transparent">
              <LogOut size={14} /> Log Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 min-h-screen relative flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#ddd4c8] dark:border-slate-800 px-4 lg:px-10 py-4 lg:py-5 flex items-center justify-between shadow-none">
           <div className="flex items-center gap-3 lg:gap-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest shrink-0">
              <button 
                className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                 <Menu size={20} />
              </button>
              <span className="hidden sm:inline hover:text-[#ff5a2f] transition-colors cursor-default">Admin</span>
              <ChevronRight size={12} className="hidden sm:block text-slate-400" />
              <span className="text-slate-900 dark:text-white font-black truncate max-w-[120px] sm:max-w-none">{links.find(l => l.href === path)?.label || "Overview"}</span>
           </div>
           
           <div className="flex items-center gap-8">
              {/* Search */}
              <div className="hidden lg:flex items-center relative group">
                <Search className="absolute left-4 w-4 h-4 text-slate-500 group-focus-within:text-[#ff5a2f] transition-colors" />
                <input 
                  type="text"
                  placeholder="Search cars... (Enter)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleGlobalSearch}
                  className="bg-[#f7f6f3] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl pl-12 pr-4 py-2.5 text-[13px] font-medium w-64 focus:w-80 focus:border-[#ff5a2f]/50 focus:bg-white focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center gap-3 lg:gap-4 border-l border-[#ddd4c8] dark:border-slate-800 pl-4 lg:pl-8">
                  <NotificationsBell variant="admin" />
                 <button className="hidden sm:block text-slate-600 hover:text-slate-900 dark:text-white transition-all" title="Configuration">
                    <Settings size={20} />
                 </button>
              </div>

              <div className="flex items-center gap-3 bg-[#ff5a2f]/10 border border-emerald-200 p-1.5 lg:pr-4 rounded-2xl group cursor-pointer hover:border-emerald-300 hover:bg-[#ff5a2f]/20 transition-all">
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-2xl bg-[#ff5a2f] text-white flex items-center justify-center font-black text-[11px] lg:text-xs group-hover:bg-[#e54a1f] transition-all duration-300">
                  AD
                </div>
                <div className="hidden lg:flex flex-col">
                  <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none">Super Admin</p>
                  <p className="text-[9px] font-bold text-[#ff5a2f] uppercase tracking-widest mt-1">Verified</p>
                </div>
              </div>
           </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-10 w-full overflow-hidden max-w-[1600px] mx-auto relative z-10 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
