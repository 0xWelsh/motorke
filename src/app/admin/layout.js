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
  Bell,
  Search,
  UserPlus,
  Command
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

const links = [
  { href: "/admin",           label: "Overview",    Icon: LayoutDashboard },
  { href: "/admin/cars",      label: "Inventory",   Icon: Car             },
  { href: "/admin/dealers",   label: "Dealers Hub", Icon: Building2       },
  { href: "/admin/approvals", label: "Moderation",  Icon: ShieldAlert     },
  { href: "/admin/users",     label: "Network",     Icon: Users           },
  { href: "/admin/leads",     label: "Intelligence",Icon: MessageSquare   },
];

const quickActions = [
  { href: "/admin/cars/new",    label: "New Unit",    Icon: Plus },
  { href: "/admin/dealers/new", label: "Join Partner", Icon: UserPlus },
];

function NavLink({ href, label, Icon, active }) {
  return (
    <Link 
      href={href} 
      className={clsx(
        "flex items-center justify-between group px-5 py-3.5 rounded-2xl transition-all duration-500",
        active 
          ? "bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]" 
          : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
      )}
    >
      <div className="flex items-center gap-3.5">
        <Icon size={18} className={clsx("transition-all duration-500", active ? "text-emerald-500" : "group-hover:scale-110 group-hover:text-emerald-400")} />
        <span className="text-[12px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  const path = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const handleGlobalSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      window.location.href = `/admin/cars?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#05070a] text-slate-200 selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950/50 backdrop-blur-3xl border-r border-white/5 flex flex-col shrink-0 sticky top-0 h-screen z-50 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-600/5 blur-[120px] -ml-32 -mt-32 pointer-events-none" />
        
        {/* Branding */}
        <div className="p-8 relative z-10">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <span className="text-slate-950 group-hover:text-white font-black text-2xl tracking-tighter transition-colors">M</span>
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tighter block leading-none">
                Motor<span className="text-emerald-500 transition-colors">ke</span>
              </span>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.25em] mt-1.5 block">
                Management
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto relative z-10 custom-scrollbar">
          <div className="px-4 mb-4">
             <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Core Systems</p>
          </div>
          {links.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
          
          <div className="px-4 mb-4 mt-10">
             <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Operations</p>
          </div>
          {quickActions.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href} />
          ))}
        </nav>

        {/* Footer / Auth */}
        <div className="p-6 border-t border-white/5 bg-black/20 relative z-10">
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-white/5">
              <ExternalLink size={14} /> Live Terminal
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 text-white/40 hover:text-rose-500 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-rose-500/5">
                <LogOut size={14} /> Deauthorize
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden relative flex flex-col">
        {/* Surface Glow Header */}
        <header className="sticky top-0 z-40 bg-[#05070a]/80 backdrop-blur-3xl border-b border-white/5 px-10 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">
              <span className="hover:text-emerald-500 transition-colors cursor-default">Admin Control</span>
              <ChevronRight size={12} className="text-white/10" />
              <span className="text-white">{links.find(l => l.href === path)?.label || "Overview"}</span>
           </div>
           
           <div className="flex items-center gap-8">
              {/* Search Interface */}
              <div className="hidden lg:flex items-center relative group">
                <Search className="absolute left-4 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search anything... (Enter) "
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleGlobalSearch}
                  className="bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-2.5 text-[12px] font-medium w-72 focus:w-96 focus:border-emerald-500/30 focus:outline-none transition-all placeholder:text-white/20"
                />
                <Command className="absolute right-4 w-3.5 h-3.5 text-white/10" />
              </div>

              <div className="flex items-center gap-5 border-l border-white/5 pl-8">
                 <button className="text-white/30 hover:text-emerald-400 transition-all relative" title="Notifications">
                    <Bell size={18} />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-slate-950" />
                 </button>
                 <button className="text-white/30 hover:text-white transition-all" title="Settings">
                    <Settings size={18} />
                 </button>
              </div>

              <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 pl-4 py-1.5 pr-1.5 rounded-2xl group cursor-pointer hover:border-emerald-500/30 transition-all">
                <div className="hidden sm:flex flex-col items-end">
                  <p className="text-[11px] font-bold text-white uppercase tracking-wider">Super Admin</p>
                  <p className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-[0.2em] flex items-center gap-1.5">
                     <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Level 4
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-105 transition-transform">
                  AD
                </div>
              </div>
           </div>
        </header>


        <div className="p-10 max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
